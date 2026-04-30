import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import { useAtom, useAtomValue } from 'jotai';

import {
  editingWorkSizeMmAtom,
  pieceSettingsAtom,
  selectedPolygonIdAtom,
} from '@/atoms/editor';
import { fabricsAtom } from '@/atoms/fabrics';
import { PieceImage } from '@/components/canvas/PieceImage';
import { useSampledPolygons } from '@/features/editor/useSampledPolygons';
import type { Design } from '@/types/design';
import { isPointInPolygon } from '@/utils/path';

export interface EditorCanvasProps {
  design: Design;
  size: number;
}

const SELECTED_STROKE = '#1d4ed8';
const DEFAULT_STROKE = '#374151';
const EMPTY_FILL = '#ffffff';
const SELECTED_FILL_OVERLAY = 'rgba(37, 99, 235, 0.15)';

/**
 * 編集画面用キャンバス。タップでピースを選択し、ピース設定があれば画像を clipPath で描画する。
 */
export const EditorCanvas = ({ design, size }: EditorCanvasProps) => {
  const [selectedId, setSelectedId] = useAtom(selectedPolygonIdAtom);
  const settings = useAtomValue(pieceSettingsAtom);
  const fabrics = useAtomValue(fabricsAtom);
  const sizeMm = useAtomValue(editingWorkSizeMmAtom);
  const sampled = useSampledPolygons(design);

  const settingsByPolygon = useMemo(() => {
    const map = new Map<string, (typeof settings)[number]>();
    for (const s of settings) map.set(s.polygonId, s);
    return map;
  }, [settings]);

  const fabricsById = useMemo(() => {
    const map = new Map<string, (typeof fabrics)[number]>();
    for (const f of fabrics) map.set(f.id, f);
    return map;
  }, [fabrics]);

  const bboxById = useMemo(() => {
    const map = new Map<string, (typeof sampled)[number]['bbox']>();
    for (const s of sampled) map.set(s.id, s.bbox);
    return map;
  }, [sampled]);

  const handlePress = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;
      const point = { x: locationX / size, y: locationY / size };
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

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="canvas"
        onPress={handlePress}
        style={styles.fill}
      >
        <Svg width={size} height={size} viewBox="0 0 1 1">
          <Defs>
            {design.polygons.map((p) => (
              <ClipPath key={`clip-${p.id}`} id={`clip-${p.id}`}>
                <Path d={p.path} />
              </ClipPath>
            ))}
          </Defs>

          {/* 1. 背景（未割当ピースは白塗り） */}
          {design.polygons.map((p) => {
            const hasImage = settingsByPolygon.has(p.id);
            return (
              <Path
                key={`bg-${p.id}`}
                d={p.path}
                fill={hasImage ? 'transparent' : EMPTY_FILL}
                stroke="none"
              />
            );
          })}

          {/* 2. 画像レイヤー（ピース形状でクリップ） */}
          {design.polygons.map((p) => {
            const setting = settingsByPolygon.get(p.id);
            if (!setting) return null;
            const fabric = fabricsById.get(setting.fabricImageId);
            const bbox = bboxById.get(p.id);
            if (!fabric || !bbox) return null;
            return (
              <G key={`img-${p.id}`} clipPath={`url(#clip-${p.id})`}>
                <PieceImage
                  imageUri={fabric.imagePath}
                  bbox={bbox}
                  offsetX={setting.offsetX}
                  offsetY={setting.offsetY}
                  rotation={setting.rotation}
                  sizeMm={sizeMm}
                  pxPerMm={fabric.pxPerMm}
                />
              </G>
            );
          })}

          {/* 3. 選択ハイライト（半透明オーバーレイ） */}
          {selectedId &&
            (() => {
              const polygon = design.polygons.find((p) => p.id === selectedId);
              if (!polygon) return null;
              return (
                <Path
                  d={polygon.path}
                  fill={SELECTED_FILL_OVERLAY}
                  stroke="none"
                />
              );
            })()}

          {/* 4. ピース境界線 */}
          {design.polygons.map((p) => (
            <Path
              key={`stroke-${p.id}`}
              d={p.path}
              fill="none"
              stroke={p.id === selectedId ? SELECTED_STROKE : DEFAULT_STROKE}
              strokeWidth={p.id === selectedId ? 0.012 : 0.005}
            />
          ))}
        </Svg>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
});
