import { Image as SvgImage } from 'react-native-svg';

import { useResizedImageUri } from '@/hooks/useResizedImageUri';
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
 *   drawScalePerPx = 1 / (pxPerMm * sizeMm * resizeRatio)
 *
 * フォールバック（未キャリブレーション）:
 *   drawScalePerPx = max(bbox.w / resized.w, bbox.h / resized.h)   // cover
 *
 * SVG transform は画像中心まわりの回転を含む:
 *   translate(centerX, centerY)
 *     rotate(rotationRad → deg)
 *     scale(drawScalePerPx)
 *     translate(-resized.w/2, -resized.h/2)
 *
 * `<image>` の width/height はリサイズ後のピクセル単位で渡す。
 * 元画像が大きい場合は useResizedImageUri により 2048px 以内に縮小し
 * ネイティブメモリの OOM を防ぐ。
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
  const image = useResizedImageUri(imageUri);
  if (!image) {
    return null;
  }

  let drawScalePerPx: number;
  if (pxPerMm != null && pxPerMm > 0 && sizeMm != null && sizeMm > 0) {
    // 実寸モード: リサイズ比率で pxPerMm を補正する
    drawScalePerPx = 1 / (pxPerMm * sizeMm * image.ratio);
  } else {
    // cover フォールバック: リサイズ後サイズで bbox を覆う最小倍率
    drawScalePerPx = Math.max(bbox.width / image.width, bbox.height / image.height);
  }

  const centerX = bbox.minX + bbox.width * (0.5 + offsetX);
  const centerY = bbox.minY + bbox.height * (0.5 + offsetY);
  const rotationDeg = (rotation * 180) / Math.PI;

  return (
    <SvgImage
      href={image.uri}
      x={0}
      y={0}
      width={image.width}
      height={image.height}
      preserveAspectRatio="xMidYMid slice"
      transform={
        `translate(${centerX}, ${centerY}) ` +
        `rotate(${rotationDeg}) ` +
        `scale(${drawScalePerPx}) ` +
        `translate(${-image.width / 2}, ${-image.height / 2})`
      }
    />
  );
};
