import { Image } from 'react-native';

import * as FileSystemLegacy from 'expo-file-system/legacy';

import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { PieceSetting, Work } from '@/types/work';
import { computeBbox, samplePath } from '@/utils/path';

export type PaperSize = 'A4' | 'A3' | 'Letter';

export interface PaperDimensions {
  /** 幅（PostScript point = 1/72 inch） */
  widthPt: number;
  /** 高さ（PostScript point = 1/72 inch） */
  heightPt: number;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A4: { widthPt: 595, heightPt: 842 },
  A3: { widthPt: 842, heightPt: 1191 },
  Letter: { widthPt: 612, heightPt: 792 },
};

const MARGIN_PT = 36;

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err),
    );
  });
}

function inferMime(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function toDataUri(localUri: string): Promise<string> {
  const base64 = await FileSystemLegacy.readAsStringAsync(localUri, {
    encoding: 'base64',
  });
  return `data:${inferMime(localUri)};base64,${base64}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface BuildPdfHtmlInput {
  work: Work;
  design: Design;
  fabrics: readonly FabricImage[];
  paperSize: PaperSize;
  scaleNote: string;
}

/**
 * 印刷用 PDF の HTML を生成する。
 *
 * - 用紙サイズに合わせた中央配置・正方形のキャンバスを描画
 * - ピース形状を SVG ClipPath でクリップし、布地画像を base64 で埋め込み
 * - 描画式は CLAUDE.md「ピース内画像座標系」に準拠
 */
export async function buildPdfHtml(input: BuildPdfHtmlInput): Promise<string> {
  const { work, design, fabrics, paperSize, scaleNote } = input;
  const paper = PAPER_SIZES[paperSize];

  const fabricsById = new Map<string, FabricImage>();
  for (const f of fabrics) fabricsById.set(f.id, f);

  // 必要な布地画像のサイズと base64 を収集
  const usedFabricIds = new Set<string>();
  for (const s of work.pieceSettings) usedFabricIds.add(s.fabricImageId);
  const fabricMeta = new Map<string, { dataUri: string; width: number; height: number }>();
  await Promise.all(
    Array.from(usedFabricIds).map(async (id) => {
      const fabric = fabricsById.get(id);
      if (!fabric) return;
      const [size, dataUri] = await Promise.all([
        imageSize(fabric.imagePath),
        toDataUri(fabric.imagePath),
      ]);
      fabricMeta.set(id, { dataUri, width: size.width, height: size.height });
    }),
  );

  const settingsByPolygon = new Map<string, PieceSetting>();
  for (const s of work.pieceSettings) settingsByPolygon.set(s.polygonId, s);

  const bboxById = new Map<string, ReturnType<typeof computeBbox>>();
  for (const polygon of design.polygons) {
    bboxById.set(polygon.id, computeBbox(samplePath(polygon.path)));
  }

  // 描画キャンバスは用紙の短辺 - 余白 を一辺とする正方形
  const canvasSide = Math.min(paper.widthPt, paper.heightPt) - MARGIN_PT * 2;

  const defsHtml = design.polygons
    .map((p) => `<clipPath id="clip-${escapeHtml(p.id)}"><path d="${escapeHtml(p.path)}"/></clipPath>`)
    .join('');

  const piecesHtml = design.polygons
    .map((polygon) => {
      const setting = settingsByPolygon.get(polygon.id);
      const bbox = bboxById.get(polygon.id);
      if (!setting || !bbox) {
        return `<path d="${escapeHtml(polygon.path)}" fill="#ffffff" stroke="none"/>`;
      }
      const meta = fabricMeta.get(setting.fabricImageId);
      if (!meta) {
        return `<path d="${escapeHtml(polygon.path)}" fill="#ffffff" stroke="none"/>`;
      }
      const fitScale = Math.max(bbox.width / meta.width, bbox.height / meta.height);
      const drawScale = fitScale * setting.scale;
      const drawW = meta.width * drawScale;
      const drawH = meta.height * drawScale;
      const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX);
      const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY);
      const x = cx - drawW / 2;
      const y = cy - drawH / 2;
      return `
        <g clip-path="url(#clip-${escapeHtml(polygon.id)})">
          <image href="${meta.dataUri}" x="${x}" y="${y}" width="${drawW}" height="${drawH}" preserveAspectRatio="none"/>
        </g>
      `;
    })
    .join('');

  const strokesHtml = design.polygons
    .map(
      (p) =>
        `<path d="${escapeHtml(p.path)}" fill="none" stroke="#374151" stroke-width="0.005"/>`,
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${paper.widthPt}pt ${paper.heightPt}pt; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .page {
        width: ${paper.widthPt}pt;
        height: ${paper.heightPt}pt;
        padding: ${MARGIN_PT}pt;
        box-sizing: border-box;
        font-family: -apple-system, system-ui, sans-serif;
        color: #111;
      }
      h1 { font-size: 14pt; margin: 0 0 8pt 0; }
      .meta { font-size: 10pt; margin-bottom: 8pt; color: #555; }
      .canvas-wrap { display: flex; justify-content: center; }
      svg { background: #fff; }
      .scale { margin-top: 8pt; font-size: 10pt; color: #333; }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>${escapeHtml(work.name)}</h1>
      <div class="meta">${escapeHtml(design.name)} (${escapeHtml(paperSize)})</div>
      <div class="canvas-wrap">
        <svg width="${canvasSide}pt" height="${canvasSide}pt" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
          <defs>${defsHtml}</defs>
          ${piecesHtml}
          ${strokesHtml}
        </svg>
      </div>
      <div class="scale">${escapeHtml(scaleNote)}</div>
    </div>
  </body>
</html>`;
}
