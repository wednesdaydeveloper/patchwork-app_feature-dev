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
 * 実装上の注意:
 *   `<image width=W height=H>` を SVG 単位で小さい値（例: 0.5）で指定すると、
 *   react-native-svg はラスタライズ時の解像度を実質 1 ピクセル相当にしてしまい、
 *   結果として画像がぼやけ・引き伸ばしたように見える。
 *   そのためここでは画像を「自然ピクセル単位」で配置（width=imagePx.w, height=imagePx.h）し、
 *   SVG の transform で目的のピース座標系（0..1 パターン単位）にスケール＋移動する。
 *
 * 描画式（実寸モード、`pxPerMm != null` かつ `sizeMm != null`）:
 *   drawScalePerPx = scale / (pxPerMm * sizeMm)
 *
 * フォールバック（未キャリブレーション）:
 *   drawScalePerPx = scale * max(bbox.w / imagePx.w, bbox.h / imagePx.h)   // cover
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

  let drawScalePerPx: number;

  if (pxPerMm != null && pxPerMm > 0 && sizeMm != null && sizeMm > 0) {
    // 実寸モード
    drawScalePerPx = scale / (pxPerMm * sizeMm);
  } else {
    // フォールバック（cover）
    const fitScale = Math.max(bbox.width / size.width, bbox.height / size.height);
    drawScalePerPx = fitScale * scale;
  }

  const centerX = bbox.minX + bbox.width * (0.5 + offsetX);
  const centerY = bbox.minY + bbox.height * (0.5 + offsetY);
  const tx = centerX - (size.width * drawScalePerPx) / 2;
  const ty = centerY - (size.height * drawScalePerPx) / 2;

  return (
    <SvgImage
      href={imageUri}
      x={0}
      y={0}
      width={size.width}
      height={size.height}
      preserveAspectRatio="xMidYMid slice"
      transform={`translate(${tx}, ${ty}) scale(${drawScalePerPx})`}
    />
  );
};
