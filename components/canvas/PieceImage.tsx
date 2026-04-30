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
  /** 画像中心まわりの回転（ラジアン）。デフォルト 0。 */
  rotation?: number;
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
 *   drawScalePerPx = 1 / (pxPerMm * sizeMm)
 *
 * フォールバック（未キャリブレーション）:
 *   drawScalePerPx = max(bbox.w / imagePx.w, bbox.h / imagePx.h)   // cover
 *
 * SVG transform は画像中心まわりの回転を含む:
 *   translate(centerX, centerY)
 *     rotate(rotationRad → deg)
 *     scale(drawScalePerPx)
 *     translate(-imagePx.w/2, -imagePx.h/2)
 *
 * `<image>` の width/height は自然ピクセル単位で渡し、ラスタライズ精度低下を避ける
 * （0..1 単位の小さな値だと react-native-svg が実質 1px ターゲットに丸める問題への対策）。
 */
export const PieceImage = ({
  imageUri,
  bbox,
  offsetX,
  offsetY,
  rotation = 0,
  sizeMm,
  pxPerMm,
}: PieceImageProps) => {
  const size = useImageSize(imageUri);
  if (!size || size.width === 0 || size.height === 0) {
    return null;
  }

  let drawScalePerPx: number;
  if (pxPerMm != null && pxPerMm > 0 && sizeMm != null && sizeMm > 0) {
    drawScalePerPx = 1 / (pxPerMm * sizeMm);
  } else {
    drawScalePerPx = Math.max(bbox.width / size.width, bbox.height / size.height);
  }

  const centerX = bbox.minX + bbox.width * (0.5 + offsetX);
  const centerY = bbox.minY + bbox.height * (0.5 + offsetY);
  const rotationDeg = (rotation * 180) / Math.PI;

  return (
    <SvgImage
      href={imageUri}
      x={0}
      y={0}
      width={size.width}
      height={size.height}
      preserveAspectRatio="xMidYMid slice"
      transform={
        `translate(${centerX}, ${centerY}) ` +
        `rotate(${rotationDeg}) ` +
        `scale(${drawScalePerPx}) ` +
        `translate(${-size.width / 2}, ${-size.height / 2})`
      }
    />
  );
};
