import { Image } from 'react-native';

import * as FileSystemLegacy from 'expo-file-system/legacy';

import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { PieceSetting, Work } from '@/types/work';
import { computeBbox, samplePath } from '@/utils/path';

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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface BuildSvgInput {
  work: Work;
  design: Design;
  fabrics: readonly FabricImage[];
  /**
   * 描画一辺サイズ (mm)。`Work.sizeMm` を使うのが基本だが、PDF が縮小印刷を要求する
   * 場合は呼び出し側が縮小値を渡すために使う。省略時は `work.sizeMm`。
   */
  effectiveSizeMm?: number;
  /**
   * `xmlns` を含む単独 SVG 文書として出力するか。
   * - true: `<svg xmlns="...">...</svg>` (標準アプリで開ける単独ファイル)
   * - false: PDF 等への埋め込み用 (xmlns なし)
   */
  standalone?: boolean;
}

/**
 * パッチワーク 1 作品を `<svg>` 文字列として生成する。
 *
 * - viewBox `0 0 1 1` 固定
 * - 単独モード (standalone=true) では `xmlns` と `width/height` を mm 単位で付与し、
 *   ブラウザや SVG ビューアで実寸表示できるようにする
 * - 布地画像は base64 data URI で埋め込み単一ファイルで完結する
 *
 * 描画式は CLAUDE.md 「ピース内画像座標系」に準拠 (PDF 出力と共通)。
 */
export async function buildSvgString(input: BuildSvgInput): Promise<string> {
  const { work, design, fabrics, standalone = false } = input;
  const sizeMm = input.effectiveSizeMm ?? work.sizeMm;

  const fabricsById = new Map<string, FabricImage>();
  for (const f of fabrics) fabricsById.set(f.id, f);

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

  const defsXml = design.polygons
    .map(
      (p) => `<clipPath id="clip-${escapeXml(p.id)}"><path d="${escapeXml(p.path)}"/></clipPath>`,
    )
    .join('');

  const piecesXml = design.polygons
    .map((polygon) => {
      const setting = settingsByPolygon.get(polygon.id);
      const bbox = bboxById.get(polygon.id);
      if (!setting || !bbox) {
        return `<path d="${escapeXml(polygon.path)}" fill="#ffffff" stroke="none"/>`;
      }
      const meta = fabricMeta.get(setting.fabricImageId);
      if (!meta) {
        return `<path d="${escapeXml(polygon.path)}" fill="#ffffff" stroke="none"/>`;
      }
      const fabric = fabricsById.get(setting.fabricImageId);
      const useRealScale = !!fabric && fabric.pxPerMm != null && fabric.pxPerMm > 0;
      let drawScalePerPx: number;
      if (useRealScale && fabric && fabric.pxPerMm) {
        drawScalePerPx = 1 / (fabric.pxPerMm * sizeMm);
      } else {
        drawScalePerPx = Math.max(bbox.width / meta.width, bbox.height / meta.height);
      }
      const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX);
      const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY);
      const rotationDeg = (setting.rotation * 180) / Math.PI;
      return `<g clip-path="url(#clip-${escapeXml(polygon.id)})"><image href="${meta.dataUri}" x="0" y="0" width="${meta.width}" height="${meta.height}" preserveAspectRatio="xMidYMid slice" transform="translate(${cx}, ${cy}) rotate(${rotationDeg}) scale(${drawScalePerPx}) translate(${-meta.width / 2}, ${-meta.height / 2})"/></g>`;
    })
    .join('');

  const strokesXml = design.polygons
    .map(
      (p) =>
        `<path d="${escapeXml(p.path)}" fill="none" stroke="#374151" stroke-width="0.005"/>`,
    )
    .join('');

  const xmlns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const dimensions = standalone ? ` width="${sizeMm}mm" height="${sizeMm}mm"` : ` width="${sizeMm}mm" height="${sizeMm}mm"`;
  const prelude = standalone ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';

  return `${prelude}<svg${dimensions} viewBox="0 0 1 1"${xmlns}><defs>${defsXml}</defs>${piecesXml}${strokesXml}</svg>`;
}
