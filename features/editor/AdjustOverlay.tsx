import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  adjustModeAtom,
  pieceSettingsAtom,
  selectedDesignAtom,
  selectedPolygonIdAtom,
} from '@/atoms/editor';
import { fabricsAtom } from '@/atoms/fabrics';
import { Button } from '@/components/ui/Button';
import { PieceImage } from '@/components/canvas/PieceImage';
import { useSampledPolygons } from '@/features/editor/useSampledPolygons';

export interface AdjustOverlayProps {
  size: number;
}

const PADDING_RATIO = 0.05;

/**
 * 調整モードのオーバーレイ。選択中ピースだけを bbox の正方形に拡大して描画する。
 * 移動・拡大の実体は #32 で実装する。
 */
export const AdjustOverlay = ({ size }: AdjustOverlayProps) => {
  const { t } = useTranslation();
  const adjustMode = useAtomValue(adjustModeAtom);
  const setAdjustMode = useSetAtom(adjustModeAtom);
  const design = useAtomValue(selectedDesignAtom);
  const selectedId = useAtomValue(selectedPolygonIdAtom);
  const settings = useAtomValue(pieceSettingsAtom);
  const fabrics = useAtomValue(fabricsAtom);
  const sampled = useSampledPolygons(design);

  if (!adjustMode || !design || !selectedId) {
    return null;
  }

  const polygon = design.polygons.find((p) => p.id === selectedId);
  const bbox = sampled.find((s) => s.id === selectedId)?.bbox;
  const setting = settings.find((s) => s.polygonId === selectedId);
  const fabric = setting ? fabrics.find((f) => f.id === setting.fabricImageId) : undefined;

  if (!polygon || !bbox) {
    return null;
  }

  // bbox を中央に置く正方形 viewBox を作る
  const dim = Math.max(bbox.width, bbox.height);
  const padding = dim * PADDING_RATIO;
  const vbSize = dim + padding * 2;
  const vbMinX = bbox.minX + bbox.width / 2 - vbSize / 2;
  const vbMinY = bbox.minY + bbox.height / 2 - vbSize / 2;
  const viewBox = `${vbMinX} ${vbMinY} ${vbSize} ${vbSize}`;

  return (
    <View style={styles.overlay}>
      <View style={[styles.canvasContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={viewBox}>
          <Defs>
            <ClipPath id={`adjust-clip-${polygon.id}`}>
              <Path d={polygon.path} />
            </ClipPath>
          </Defs>
          <Path d={polygon.path} fill="#ffffff" stroke="none" />
          {setting && fabric && (
            <G clipPath={`url(#adjust-clip-${polygon.id})`}>
              <PieceImage
                imageUri={fabric.imagePath}
                bbox={bbox}
                offsetX={setting.offsetX}
                offsetY={setting.offsetY}
                scale={setting.scale}
              />
            </G>
          )}
          <Path d={polygon.path} fill="none" stroke="#1d4ed8" strokeWidth={vbSize * 0.008} />
        </Svg>
      </View>
      <View style={styles.actions}>
        <Text style={styles.hint}>
          {t(`piece.${polygon.label}`, { defaultValue: polygon.label })}
        </Text>
        <Button label={t('editor.finishAdjust')} onPress={() => setAdjustMode(false)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  canvasContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
  },
});
