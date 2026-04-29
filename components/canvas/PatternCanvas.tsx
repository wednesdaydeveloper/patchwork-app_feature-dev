import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import { Piece } from '@/components/canvas/Piece';
import type { Design, Polygon } from '@/types/design';

export interface CanvasPieceStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface PatternCanvasProps {
  design: Design;
  size: number;
  /** ピースごとの描画スタイル上書き（id をキーにする） */
  pieceStyles?: Record<string, CanvasPieceStyle>;
  /** ピースの上に重ねる任意レンダラ（画像描画用、後続タスクで使う） */
  renderPieceOverlay?: (polygon: Polygon) => React.ReactNode;
  /** 全体に重ねる任意レンダラ（選択枠など） */
  renderOverlay?: () => React.ReactNode;
}

/**
 * パッチワークのパターンを 1×1 の正規化座標で描画するキャンバス基盤。
 *
 * - viewBox を `0 0 1 1` に固定し、表示サイズはコンテナで指定する
 * - 子コンポーネント `Piece` は `React.memo` で不要な再描画を抑制
 * - 画像描画やジェスチャーは後続タスク（#28〜#32）で本コンポーネントの上に積む
 */
export const PatternCanvas = memo(
  ({ design, size, pieceStyles, renderPieceOverlay, renderOverlay }: PatternCanvasProps) => {
    const polygons = useMemo(() => design.polygons, [design.polygons]);

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 1 1">
          {polygons.map((polygon) => {
            const style = pieceStyles?.[polygon.id];
            return (
              <Piece
                key={polygon.id}
                polygon={polygon}
                fill={style?.fill}
                stroke={style?.stroke}
                strokeWidth={style?.strokeWidth}
              />
            );
          })}
          {renderPieceOverlay &&
            polygons.map((polygon) => (
              <React.Fragment key={`overlay-${polygon.id}`}>
                {renderPieceOverlay(polygon)}
              </React.Fragment>
            ))}
          {renderOverlay?.()}
        </Svg>
      </View>
    );
  },
);

PatternCanvas.displayName = 'PatternCanvas';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
