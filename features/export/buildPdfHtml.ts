import { Image } from 'react-native';

import * as FileSystemLegacy from 'expo-file-system/legacy';

import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { PieceSetting, Work } from '@/types/work';
import { computeBbox, samplePath } from '@/utils/path';
import { cropFabricForPiece, resizeForExport } from '@/utils/imageResize';

import { PAPER_SIZES, type PaperSize } from './paperSize';

export {
  PAPER_SIZES,
  getPaperPrintableSquareMm,
  type PaperDimensions,
  type PaperSize,
} from './paperSize';

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

async function toDataUri(localUri: string): Promise<string> {
  const base64 = await FileSystemLegacy.readAsStringAsync(localUri, {
    encoding: 'base64',
  });
  return `data:image/jpeg;base64,${base64}`;
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
  /**
   * 描画に使用する一辺サイズ（mm）。`work.sizeMm` をそのまま使うと印刷可能領域に
   * 収まらないケースで、呼び出し側が縮小値を渡すために使う。省略時は `work.sizeMm`。
   */
  effectiveSizeMm?: number;
}

/**
 * 印刷用 PDF の HTML を生成する。
 *
 * メモリ効率化:
 * - 布地画像は最大 1024px にリサイズしてから処理する
 * - ピースごとに表示領域のみをクロップして base64 エンコードする
 * - ファブリックのリサイズとピースのクロップを順次処理してピークメモリを抑制する
 */
export async function buildPdfHtml(input: BuildPdfHtmlInput): Promise<string> {
  const { work, design, fabrics, paperSize, scaleNote } = input;
  const paper = PAPER_SIZES[paperSize];
  const sizeMm = input.effectiveSizeMm ?? work.sizeMm;

  const fabricsById = new Map<string, FabricImage>();
  for (const f of fabrics) fabricsById.set(f.id, f);

  const usedFabricIds = new Set<string>();
  for (const s of work.pieceSettings) usedFabricIds.add(s.fabricImageId);

  // Phase 1: ユニークな布地ごとに順次リサイズ
  interface ResizedFabric {
    uri: string;
    width: number;
    height: number;
    ratio: number;
  }
  const resizedFabrics = new Map<string, ResizedFabric>();
  for (const id of usedFabricIds) {
    const fabric = fabricsById.get(id);
    if (!fabric) continue;
    const origSize = await imageSize(fabric.imagePath);
    const resized = await resizeForExport(fabric.imagePath, origSize.width, origSize.height);
    resizedFabrics.set(id, { ...resized, ratio: resized.width / origSize.width });
  }

  const settingsByPolygon = new Map<string, PieceSetting>();
  for (const s of work.pieceSettings) settingsByPolygon.set(s.polygonId, s);

  const bboxById = new Map<string, ReturnType<typeof computeBbox>>();
  for (const polygon of design.polygons) {
    bboxById.set(polygon.id, computeBbox(samplePath(polygon.path)));
  }

  // Phase 2: ピースごとに表示領域をクロップ → エンコード → HTML 生成（順次処理）
  const defsHtml = design.polygons
    .map(
      (p) =>
        `<clipPath id="clip-${escapeHtml(p.id)}"><path d="${escapeHtml(p.path)}"/></clipPath>`,
    )
    .join('');

  const piecesHtmlParts: string[] = [];
  for (const polygon of design.polygons) {
    const setting = settingsByPolygon.get(polygon.id);
    const bbox = bboxById.get(polygon.id);
    if (!setting || !bbox) {
      piecesHtmlParts.push(
        `<path d="${escapeHtml(polygon.path)}" fill="#ffffff" stroke="none"/>`,
      );
      continue;
    }
    const fabric = fabricsById.get(setting.fabricImageId);
    const resized = resizedFabrics.get(setting.fabricImageId);
    if (!resized) {
      piecesHtmlParts.push(
        `<path d="${escapeHtml(polygon.path)}" fill="#ffffff" stroke="none"/>`,
      );
      continue;
    }

    let drawScalePerPx: number;
    if (fabric && fabric.pxPerMm != null && fabric.pxPerMm > 0) {
      drawScalePerPx = 1 / (fabric.pxPerMm * resized.ratio * sizeMm);
    } else {
      drawScalePerPx = Math.max(bbox.width / resized.width, bbox.height / resized.height);
    }

    const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX);
    const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY);
    const rotationDeg = (setting.rotation * 180) / Math.PI;

    const crop = await cropFabricForPiece(
      resized.uri, resized.width, resized.height,
      bbox, cx, cy, drawScalePerPx, rotationDeg,
    );
    const dataUri = await toDataUri(crop.uri);

    piecesHtmlParts.push(
      `<g clip-path="url(#clip-${escapeHtml(polygon.id)})">` +
      `<image href="${dataUri}" x="0" y="0" ` +
      `width="${crop.width}" height="${crop.height}" ` +
      `preserveAspectRatio="xMidYMid slice" ` +
      `transform="translate(${cx}, ${cy}) rotate(${rotationDeg}) scale(${drawScalePerPx}) ` +
      `translate(${-crop.centerOffX}, ${-crop.centerOffY})"/>` +
      `</g>`,
    );
  }

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
        <svg width="${sizeMm}mm" height="${sizeMm}mm" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
          <defs>${defsHtml}</defs>
          ${piecesHtmlParts.join('')}
          ${strokesHtml}
        </svg>
      </div>
      <div class="scale">${escapeHtml(scaleNote)}</div>
    </div>
  </body>
</html>`;
}
