import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { PieceImage } from '@/components/canvas/PieceImage';
import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { PieceSetting } from '@/types/work';
import { computeBbox, samplePath } from '@/utils/path';

export interface WorkCanvasProps {
  design: Design;
  pieceSettings: readonly PieceSetting[];
  fabrics: readonly FabricImage[];
  size: number;
  /** 境界線を描くか（エクスポート画像では非表示にしたい場合 false） */
  showBorders?: boolean;
  /** SVG 内部に描く全面背景色。JPEG エクスポートで黒塗りを避けるために指定する。 */
  backgroundFill?: string;
}

/**
 * 読み取り専用の Work プレビュー。エディタの選択ハイライトを除いた純粋な描画用。
 * エクスポート画面のプレビューおよびオフスクリーン高解像度描画で再利用する。
 */
export const WorkCanvas = ({
  design,
  pieceSettings,
  fabrics,
  size,
  showBorders = true,
  backgroundFill,
}: WorkCanvasProps) => {
  const bboxById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeBbox>>();
    for (const polygon of design.polygons) {
      map.set(polygon.id, computeBbox(samplePath(polygon.path)));
    }
    return map;
  }, [design.polygons]);

  const settingsByPolygon = useMemo(() => {
    const map = new Map<string, PieceSetting>();
    for (const s of pieceSettings) map.set(s.polygonId, s);
    return map;
  }, [pieceSettings]);

  const fabricsById = useMemo(() => {
    const map = new Map<string, FabricImage>();
    for (const f of fabrics) map.set(f.id, f);
    return map;
  }, [fabrics]);

  return (
    <View collapsable={false} style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 1 1">
        {backgroundFill && <Rect x={0} y={0} width={1} height={1} fill={backgroundFill} />}
        <Defs>
          {design.polygons.map((p) => (
            <ClipPath key={`clip-${p.id}`} id={`clip-${p.id}`}>
              <Path d={p.path} />
            </ClipPath>
          ))}
        </Defs>

        {design.polygons.map((p) => {
          const hasImage = settingsByPolygon.has(p.id);
          return (
            <Path
              key={`bg-${p.id}`}
              d={p.path}
              fill={hasImage ? 'transparent' : '#ffffff'}
              stroke="none"
            />
          );
        })}

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
                scale={setting.scale}
              />
            </G>
          );
        })}

        {showBorders &&
          design.polygons.map((p) => (
            <Path
              key={`stroke-${p.id}`}
              d={p.path}
              fill="none"
              stroke="#374151"
              strokeWidth={0.005}
            />
          ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
