import { Image as SvgImage } from 'react-native-svg';

import { useImageSize } from '@/hooks/useImageSize';
import type { Bbox } from '@/utils/path';

export interface PieceImageProps {
  imageUri: string;
  bbox: Bbox;
  /** 正規化オフセット X（bbox 幅を 1 とする、中心 = 0） */
  offsetX: number;
  /** 正規化オフセット Y（bbox 高さを 1 とする、中心 = 0） */
  offsetY: number;
  /**
   * 表示倍率。
   * - キャリブレーション済（pxPerMm != null）の場合: scale=1 で画像が実寸表示される
   * - 未キャリブレーションの場合: scale=1 で画像が bbox を cover する最小倍率（旧来挙動）
   */
  scale: number;
  /** パッチワーク一辺の物理サイズ（mm）。実寸描画に必須。 */
  sizeMm?: number;
  /** 画像の 1mm あたりの px 数。null の場合は cover フォールバック。 */
  pxPerMm?: number | null;
}

/**
 * ピース内に画像を配置する SVG `<Image>` レイヤー。
 *
 * クリッピングは呼び出し側で `<G clipPath="url(...)">` を被せて行う。
 *
 * 描画式（実寸モード、`pxPerMm != null` かつ `sizeMm != null`）:
 * - imageNaturalMmW = imagePx.w / pxPerMm
 * - imageNaturalNormW = imageNaturalMmW / sizeMm    // 0..1 パターン座標へ投影
 * - drawW = imageNaturalNormW * scale
 *   （drawH も同様、画像のアスペクト比は preserveAspectRatio で維持）
 *
 * フォールバック（未キャリブレーション）:
 * - fitScale = max(bbox.w / imagePx.w, bbox.h / imagePx.h)  // cover
 * - drawScale = fitScale * scale
 */
export const PieceImage = ({
  imageUri,
  bbox,
  offsetX,
  offsetY,
  scale,
  sizeMm,
  pxPerMm,
}: PieceImageProps) => {
  const size = useImageSize(imageUri);
  if (!size || size.width === 0 || size.height === 0) {
    return null;
  }

  let drawWidth: number;
  let drawHeight: number;

  if (pxPerMm != null && pxPerMm > 0 && sizeMm != null && sizeMm > 0) {
    // 実寸モード: パターン座標 0..1 のうち、画像の物理サイズ / パッチワーク物理サイズ の比で描画
    const imageMmW = size.width / pxPerMm;
    const imageMmH = size.height / pxPerMm;
    drawWidth = (imageMmW / sizeMm) * scale;
    drawHeight = (imageMmH / sizeMm) * scale;
  } else {
    // フォールバック（旧 cover 動作）
    const fitScale = Math.max(bbox.width / size.width, bbox.height / size.height);
    const drawScale = fitScale * scale;
    drawWidth = size.width * drawScale;
    drawHeight = size.height * drawScale;
  }

  const centerX = bbox.minX + bbox.width * (0.5 + offsetX);
  const centerY = bbox.minY + bbox.height * (0.5 + offsetY);
  const x = centerX - drawWidth / 2;
  const y = centerY - drawHeight / 2;

  return (
    <SvgImage
      href={imageUri}
      x={x}
      y={y}
      width={drawWidth}
      height={drawHeight}
      preserveAspectRatio="xMidYMid slice"
    />
  );
};
