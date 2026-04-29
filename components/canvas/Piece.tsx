import { memo } from 'react';
import { Path } from 'react-native-svg';

import type { Polygon } from '@/types/design';

export interface PieceProps {
  polygon: Polygon;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** 正規化座標 → 端末ピクセル座標へのスケール（viewBox を使う場合は 1） */
  scale?: number;
}

/**
 * 単一ピースの SVG `<Path>` 描画。
 * viewBox 0..1 の中で path をそのまま描く想定。
 */
export const Piece = memo(({ polygon, fill = '#fff', stroke = '#374151', strokeWidth = 0.005, scale = 1 }: PieceProps) => {
  return (
    <Path
      d={polygon.path}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth * scale}
    />
  );
});

Piece.displayName = 'Piece';
