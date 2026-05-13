import { Image } from 'react-native';

import * as FileSystemLegacy from 'expo-file-system/legacy';

import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { PieceSetting, Work } from '@/types/work';
import { computeBbox, samplePath } from '@/utils/path';
import { cropFabricForPiece, resizeForExport } from '@/utils/imageResize';

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
 * メモリ効率化:
 * - 布地画像は最大 1024px にリサイズしてから処理する
 * - ピースごとに表示領域のみをクロップして base64 エンコードする
 * - ファブリックのリサイズとピースのクロップを順次処理してピークメモリを抑制する
 */
export async function buildSvgString(input: BuildSvgInput): Promise<string> {
  const { work, design, fabrics, standalone = false } = input;
  const sizeMm = input.effectiveSizeMm ?? work.sizeMm;

  const fabricsById = new Map<string, FabricImage>();
  for (const f of fabrics) fabricsById.set(f.id, f);

  const usedFabricIds = new Set<string>();
  for (const s of work.pieceSettings) usedFabricIds.add(s.fabricImageId);

  // Phase 1: ユニークな布地ごとに順次リサイズ（ピーク JS ヒープを抑制）
  interface ResizedFabric {
    uri: string;
    width: number;
    height: number;
    ratio: number; // resizedWidth / originalWidth（pxPerMm 補正に使う）
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

  // Phase 2: ピースごとに表示領域をクロップ → エンコード → XML 生成（順次処理）
  // 同時に保持する base64 文字列は常に 1 ピース分のみ
  const piecesXmlParts: string[] = [];
  for (const polygon of design.polygons) {
    const setting = settingsByPolygon.get(polygon.id);
    const bbox = bboxById.get(polygon.id);
    if (!setting || !bbox) {
      piecesXmlParts.push(
        `<path d="${escapeXml(polygon.path)}" fill="#ffffff" stroke="none"/>`,
      );
      continue;
    }
    const fabric = fabricsById.get(setting.fabricImageId);
    const resized = resizedFabrics.get(setting.fabricImageId);
    if (!resized) {
      piecesXmlParts.push(
        `<path d="${escapeXml(polygon.path)}" fill="#ffffff" stroke="none"/>`,
      );
      continue;
    }

    let drawScalePerPx: number;
    if (fabric && fabric.pxPerMm != null && fabric.pxPerMm > 0) {
      // 実寸モード: リサイズで解像度が下がった分だけ pxPerMm を補正
      drawScalePerPx = 1 / (fabric.pxPerMm * resized.ratio * sizeMm);
    } else {
      // cover フォールバック: リサイズ後サイズで bbox を覆う最小倍率
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

    piecesXmlParts.push(
      `<g clip-path="url(#clip-${escapeXml(polygon.id)})">` +
      `<image href="${dataUri}" x="0" y="0" ` +
      `width="${crop.width}" height="${crop.height}" ` +
      `preserveAspectRatio="xMidYMid slice" ` +
      `transform="translate(${cx}, ${cy}) rotate(${rotationDeg}) scale(${drawScalePerPx}) ` +
      `translate(${-crop.centerOffX}, ${-crop.centerOffY})"/>` +
      `</g>`,
    );
  }

  const defsXml = design.polygons
    .map(
      (p) => `<clipPath id="clip-${escapeXml(p.id)}"><path d="${escapeXml(p.path)}"/></clipPath>`,
    )
    .join('');

  const strokesXml = design.polygons
    .map(
      (p) =>
        `<path d="${escapeXml(p.path)}" fill="none" stroke="#374151" stroke-width="0.005"/>`,
    )
    .join('');

  const xmlns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const dimensions = ` width="${sizeMm}mm" height="${sizeMm}mm"`;
  const prelude = standalone ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';

  return `${prelude}<svg${dimensions} viewBox="0 0 1 1"${xmlns}><defs>${defsXml}</defs>${piecesXmlParts.join('')}${strokesXml}</svg>`;
}
