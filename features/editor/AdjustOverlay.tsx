import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  adjustModeAtom,
  editingWorkSizeMmAtom,
  pieceSettingsAtom,
  selectedDesignAtom,
  selectedPolygonIdAtom,
  upsertPieceSettingAtom,
} from '@/atoms/editor';
import { fabricsAtom } from '@/atoms/fabrics';
import { pushHistoryAtom } from '@/atoms/history';
import { Button } from '@/components/ui/Button';
import { useImageSize } from '@/hooks/useImageSize';
import { useSampledPolygons } from '@/features/editor/useSampledPolygons';

export interface AdjustOverlayProps {
  size: number;
}

const PADDING_RATIO = 0.05;

const AnimatedSvgImage = Animated.createAnimatedComponent(SvgImage);

/**
 * 調整モードのオーバーレイ。選択中ピースを拡大表示し、ジェスチャで位置・回転を調整する。
 *
 * - 1 本指パン: 位置調整
 * - 2 本指回転: 画像中心まわりの回転（拡大縮小は無効）
 * - ジェスチャー終了時に `runOnJS` で `pieceSettingsAtom` へコミット
 */
export const AdjustOverlay = ({ size }: AdjustOverlayProps) => {
  const { t } = useTranslation();
  const adjustMode = useAtomValue(adjustModeAtom);
  const setAdjustMode = useSetAtom(adjustModeAtom);
  const design = useAtomValue(selectedDesignAtom);
  const selectedId = useAtomValue(selectedPolygonIdAtom);
  const settings = useAtomValue(pieceSettingsAtom);
  const fabrics = useAtomValue(fabricsAtom);
  const sizeMm = useAtomValue(editingWorkSizeMmAtom);
  const upsertPieceSetting = useSetAtom(upsertPieceSettingAtom);
  const pushHistory = useSetAtom(pushHistoryAtom);
  const sampled = useSampledPolygons(design);

  const polygon = design && selectedId ? design.polygons.find((p) => p.id === selectedId) : undefined;
  const bbox = selectedId ? sampled.find((s) => s.id === selectedId)?.bbox : undefined;
  const setting = selectedId ? settings.find((s) => s.polygonId === selectedId) : undefined;
  const fabric = setting ? fabrics.find((f) => f.id === setting.fabricImageId) : undefined;
  const imgSize = useImageSize(fabric?.imagePath ?? null);

  const liveOffsetX = useSharedValue(0);
  const liveOffsetY = useSharedValue(0);
  const liveRotation = useSharedValue(0); // ラジアン
  const startOffsetX = useSharedValue(0);
  const startOffsetY = useSharedValue(0);
  const startRotation = useSharedValue(0);

  const dim = bbox ? Math.max(bbox.width, bbox.height) : 1;
  const padding = dim * PADDING_RATIO;
  const vbSize = dim + padding * 2;
  const vbMinX = bbox ? bbox.minX + bbox.width / 2 - vbSize / 2 : 0;
  const vbMinY = bbox ? bbox.minY + bbox.height / 2 - vbSize / 2 : 0;
  const viewBox = `${vbMinX} ${vbMinY} ${vbSize} ${vbSize}`;
  const vbPerPx = vbSize / size;

  // 実寸モード: drawScale_per_px = 1 / (pxPerMm * sizeMm)
  // フォールバック（未キャリブレーション）: cover
  const useRealScale =
    !!fabric && fabric.pxPerMm != null && fabric.pxPerMm > 0 && sizeMm > 0;
  const drawScalePerPx =
    useRealScale && fabric && fabric.pxPerMm
      ? 1 / (fabric.pxPerMm * sizeMm)
      : bbox && imgSize && imgSize.width > 0 && imgSize.height > 0
        ? Math.max(bbox.width / imgSize.width, bbox.height / imgSize.height)
        : 0;

  const commit = useCallback(
    (deltaX: number, deltaY: number, deltaRotation: number) => {
      if (!selectedId || !setting || !bbox) return;
      const noChange = deltaX === 0 && deltaY === 0 && deltaRotation === 0;
      if (noChange) return;
      pushHistory();
      upsertPieceSetting({
        polygonId: selectedId,
        fabricImageId: setting.fabricImageId,
        offsetX: setting.offsetX + deltaX / bbox.width,
        offsetY: setting.offsetY + deltaY / bbox.height,
        rotation: setting.rotation + deltaRotation,
      });
    },
    [bbox, pushHistory, selectedId, setting, upsertPieceSetting],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startOffsetX.value = liveOffsetX.value;
          startOffsetY.value = liveOffsetY.value;
        })
        .onUpdate((e) => {
          liveOffsetX.value = startOffsetX.value + e.translationX * vbPerPx;
          liveOffsetY.value = startOffsetY.value + e.translationY * vbPerPx;
        })
        .onEnd(() => {
          const dx = liveOffsetX.value;
          const dy = liveOffsetY.value;
          liveOffsetX.value = 0;
          liveOffsetY.value = 0;
          runOnJS(commit)(dx, dy, 0);
        }),
    [commit, liveOffsetX, liveOffsetY, startOffsetX, startOffsetY, vbPerPx],
  );

  const rotationGesture = useMemo(
    () =>
      Gesture.Rotation()
        .onStart(() => {
          startRotation.value = liveRotation.value;
        })
        .onUpdate((e) => {
          liveRotation.value = startRotation.value + e.rotation;
        })
        .onEnd(() => {
          const dr = liveRotation.value;
          liveRotation.value = 0;
          runOnJS(commit)(0, 0, dr);
        }),
    [commit, liveRotation, startRotation],
  );

  const composed = useMemo(
    () => Gesture.Simultaneous(panGesture, rotationGesture),
    [panGesture, rotationGesture],
  );

  // 画像中心まわりの回転 + パターン座標系への配置を transform で表現
  const animatedProps = useAnimatedProps(() => {
    if (!setting || !bbox || !imgSize || drawScalePerPx === 0) {
      return { transform: 'scale(0)' };
    }
    const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX) + liveOffsetX.value;
    const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY) + liveOffsetY.value;
    const totalRotationRad = setting.rotation + liveRotation.value;
    const rotationDeg = (totalRotationRad * 180) / Math.PI;
    return {
      transform:
        `translate(${cx}, ${cy}) ` +
        `rotate(${rotationDeg}) ` +
        `scale(${drawScalePerPx}) ` +
        `translate(${-imgSize.width / 2}, ${-imgSize.height / 2})`,
    };
  });

  if (!adjustMode || !design || !selectedId || !polygon || !bbox) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.canvasContainer, { width: size, height: size }]}>
        <GestureDetector gesture={composed}>
          <Svg width={size} height={size} viewBox={viewBox}>
            <Defs>
              <ClipPath id={`adjust-clip-${polygon.id}`}>
                <Path d={polygon.path} />
              </ClipPath>
            </Defs>
            <Path d={polygon.path} fill="#ffffff" stroke="none" />
            {setting && fabric && imgSize && (
              <G clipPath={`url(#adjust-clip-${polygon.id})`}>
                <AnimatedSvgImage
                  href={fabric.imagePath}
                  x={0}
                  y={0}
                  width={imgSize.width}
                  height={imgSize.height}
                  preserveAspectRatio="xMidYMid slice"
                  animatedProps={animatedProps}
                />
              </G>
            )}
            <Path d={polygon.path} fill="none" stroke="#1d4ed8" strokeWidth={vbSize * 0.008} />
          </Svg>
        </GestureDetector>
      </View>
      <View style={styles.actions}>
        <Text style={styles.hint}>
          {t(`piece.${polygon.label}`, { defaultValue: polygon.label })}
        </Text>
        <Button
          label={t('editor.reset')}
          variant="secondary"
          onPress={() => {
            if (!setting) return;
            if (setting.offsetX === 0 && setting.offsetY === 0 && setting.rotation === 0) return;
            pushHistory();
            upsertPieceSetting({
              polygonId: setting.polygonId,
              fabricImageId: setting.fabricImageId,
              offsetX: 0,
              offsetY: 0,
              rotation: 0,
            });
          }}
        />
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
