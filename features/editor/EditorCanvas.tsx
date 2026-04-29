import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAtom } from 'jotai';

import { selectedPolygonIdAtom } from '@/atoms/editor';
import { PatternCanvas, type CanvasPieceStyle } from '@/components/canvas/PatternCanvas';
import { useSampledPolygons } from '@/features/editor/useSampledPolygons';
import type { Design } from '@/types/design';
import { isPointInPolygon } from '@/utils/path';

export interface EditorCanvasProps {
  design: Design;
  size: number;
}

const SELECTED_FILL = '#bfdbfe';
const SELECTED_STROKE = '#1d4ed8';
const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#374151';

/**
 * 編集画面用キャンバス。タップでピースを選択し、選択中ピースをハイライトする。
 *
 * - タップ位置を正規化座標へ変換し、描画順の逆（最前面から）に ray casting で当たり判定
 * - 領域外タップで選択解除
 */
export const EditorCanvas = ({ design, size }: EditorCanvasProps) => {
  const [selectedId, setSelectedId] = useAtom(selectedPolygonIdAtom);
  const sampled = useSampledPolygons(design);

  const handlePress = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;
      const point = { x: locationX / size, y: locationY / size };
      // 描画順の逆 = 最前面から判定
      for (let i = sampled.length - 1; i >= 0; i -= 1) {
        const candidate = sampled[i];
        if (isPointInPolygon(point, candidate.points)) {
          setSelectedId(candidate.id);
          return;
        }
      }
      setSelectedId(null);
    },
    [sampled, setSelectedId, size],
  );

  const pieceStyles = useMemo<Record<string, CanvasPieceStyle>>(() => {
    if (!selectedId) {
      return {};
    }
    return {
      [selectedId]: {
        fill: SELECTED_FILL,
        stroke: SELECTED_STROKE,
        strokeWidth: 0.012,
      },
    };
  }, [selectedId]);

  const defaultStyles = useMemo(() => {
    const result: Record<string, CanvasPieceStyle> = {};
    for (const polygon of design.polygons) {
      result[polygon.id] = pieceStyles[polygon.id] ?? {
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
      };
    }
    return result;
  }, [design.polygons, pieceStyles]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="canvas"
        onPress={handlePress}
        style={styles.fill}
      >
        <PatternCanvas design={design} size={size} pieceStyles={defaultStyles} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  fill: {
    flex: 1,
  },
});
