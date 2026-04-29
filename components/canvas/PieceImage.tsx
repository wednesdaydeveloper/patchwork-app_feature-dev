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
  /** 表示倍率。1.0 で画像が bbox を cover する最小倍率 */
  scale: number;
}

/**
 * ピース内に画像を配置する SVG `<Image>` レイヤー。
 *
 * 描画式（CLAUDE.md「ピース内画像座標系」参照）:
 * - fitScale = max(bbox.w / img.w, bbox.h / img.h)  // cover
 * - drawScale = fitScale * scale
 * - drawSize  = (img.w, img.h) * drawScale
 * - drawCenter = (bbox.minX + bbox.w * (0.5 + offsetX), bbox.minY + bbox.h * (0.5 + offsetY))
 * - drawTopLeft = drawCenter - drawSize / 2
 *
 * クリッピングは呼び出し側で `<G clipPath="url(...)">` を被せて行う。
 */
export const PieceImage = ({ imageUri, bbox, offsetX, offsetY, scale }: PieceImageProps) => {
  const size = useImageSize(imageUri);
  if (!size || size.width === 0 || size.height === 0) {
    return null;
  }
  const fitScale = Math.max(bbox.width / size.width, bbox.height / size.height);
  const drawScale = fitScale * scale;
  const drawWidth = size.width * drawScale;
  const drawHeight = size.height * drawScale;
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
      preserveAspectRatio="none"
    />
  );
};
