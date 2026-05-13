import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import type { Bbox } from '@/utils/path';

const MAX_EXPORT_PX = 1024;
const CROP_PAD_PX = 32;

/**
 * 長辺が maxPx を超える画像を JPEG にリサイズする。
 * maxPx 以下の場合は元 URI をそのまま返す。
 */
export async function resizeForExport(
  uri: string,
  naturalWidth: number,
  naturalHeight: number,
  maxPx: number = MAX_EXPORT_PX,
): Promise<{ uri: string; width: number; height: number }> {
  const maxDim = Math.max(naturalWidth, naturalHeight);
  if (maxDim <= maxPx) {
    return { uri, width: naturalWidth, height: naturalHeight };
  }
  const targetWidth = Math.round(naturalWidth * (maxPx / maxDim));
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: targetWidth } }],
    { format: SaveFormat.JPEG, compress: 0.85 },
  );
  return { uri: result.uri, width: result.width, height: result.height };
}

export interface CroppedImage {
  uri: string;
  width: number;
  height: number;
  /**
   * SVG transform の `translate(-x, -y)` に使う値。
   * 元画像の中心 (imgW/2, imgH/2) がクロップ後座標系で (centerOffX, centerOffY) になる。
   */
  centerOffX: number;
  centerOffY: number;
}

/**
 * ピースが表示する領域だけを布地画像からクロップして返す。
 * これにより SVG/PDF に埋め込む base64 データ量とネイティブのデコードメモリを削減する。
 *
 * 回転がある場合はクロップ領域の計算が複雑になるため元画像をそのまま返す。
 *
 * 変換式:
 *   SVG座標 → 画像ピクセル: px = (svgX - cx) / drawScalePerPx + imgW / 2
 */
export async function cropFabricForPiece(
  resizedUri: string,
  imgW: number,
  imgH: number,
  bbox: Bbox,
  cx: number,
  cy: number,
  drawScalePerPx: number,
  rotationDeg: number,
): Promise<CroppedImage> {
  const noCrop: CroppedImage = {
    uri: resizedUri,
    width: imgW,
    height: imgH,
    centerOffX: imgW / 2,
    centerOffY: imgH / 2,
  };

  if (Math.abs(rotationDeg) > 0.001) return noCrop;

  const s = drawScalePerPx;
  const pxL = (bbox.minX - cx) / s + imgW / 2;
  const pxR = (bbox.minX + bbox.width - cx) / s + imgW / 2;
  const pyT = (bbox.minY - cy) / s + imgH / 2;
  const pyB = (bbox.minY + bbox.height - cy) / s + imgH / 2;

  const cropLeft = Math.max(0, Math.floor(pxL) - CROP_PAD_PX);
  const cropTop = Math.max(0, Math.floor(pyT) - CROP_PAD_PX);
  const cropRight = Math.min(imgW, Math.ceil(pxR) + CROP_PAD_PX);
  const cropBottom = Math.min(imgH, Math.ceil(pyB) + CROP_PAD_PX);
  const cropW = cropRight - cropLeft;
  const cropH = cropBottom - cropTop;

  if (cropW <= 0 || cropH <= 0) return noCrop;
  if (cropLeft === 0 && cropTop === 0 && cropW === imgW && cropH === imgH) return noCrop;

  const result = await manipulateAsync(
    resizedUri,
    [{ crop: { originX: cropLeft, originY: cropTop, width: cropW, height: cropH } }],
    { format: SaveFormat.JPEG, compress: 0.9 },
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    // 元画像の中心がクロップ後の座標系で (imgW/2 - cropLeft, imgH/2 - cropTop) になる
    centerOffX: imgW / 2 - cropLeft,
    centerOffY: imgH / 2 - cropTop,
  };
}
