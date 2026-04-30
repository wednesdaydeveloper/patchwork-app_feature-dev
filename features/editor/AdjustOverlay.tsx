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
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

const AnimatedSvgImage = Animated.createAnimatedComponent(SvgImage);

/**
 * 調整モードのオーバーレイ。選択中ピースを拡大表示し、ピンチ／パンで位置・倍率を調整する。
 *
 * - パン・ピンチは Reanimated `useSharedValue` で UI スレッド処理（リアルタイム反映）
 * - ジェスチャー終了時に `runOnJS` で `pieceSettingsAtom` へコミット
 * - 倍率は MIN_SCALE..MAX_SCALE にクランプ
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

  // Hooks must run unconditionally; resolve nullable values below.
  const polygon = design && selectedId ? design.polygons.find((p) => p.id === selectedId) : undefined;
  const bbox = selectedId ? sampled.find((s) => s.id === selectedId)?.bbox : undefined;
  const setting = selectedId ? settings.find((s) => s.polygonId === selectedId) : undefined;
  const fabric = setting ? fabrics.find((f) => f.id === setting.fabricImageId) : undefined;
  const imgSize = useImageSize(fabric?.imagePath ?? null);

  const liveOffsetX = useSharedValue(0);
  const liveOffsetY = useSharedValue(0);
  const liveScale = useSharedValue(1);
  const startOffsetX = useSharedValue(0);
  const startOffsetY = useSharedValue(0);
  const startScale = useSharedValue(1);

  const dim = bbox ? Math.max(bbox.width, bbox.height) : 1;
  const padding = dim * PADDING_RATIO;
  const vbSize = dim + padding * 2;
  const vbMinX = bbox ? bbox.minX + bbox.width / 2 - vbSize / 2 : 0;
  const vbMinY = bbox ? bbox.minY + bbox.height / 2 - vbSize / 2 : 0;
  const viewBox = `${vbMinX} ${vbMinY} ${vbSize} ${vbSize}`;
  const vbPerPx = vbSize / size;

  // 実寸モード（pxPerMm 設定済み）: drawScale_per_px = 1 / (pxPerMm * sizeMm)
  // フォールバック（未キャリブレーション）: drawScale_per_px = max(bbox.w/img.w, bbox.h/img.h)（cover）
  const useRealScale =
    !!fabric && fabric.pxPerMm != null && fabric.pxPerMm > 0 && sizeMm > 0;
  const fitScale =
    useRealScale && fabric && fabric.pxPerMm
      ? 1 / (fabric.pxPerMm * sizeMm)
      : bbox && imgSize && imgSize.width > 0 && imgSize.height > 0
        ? Math.max(bbox.width / imgSize.width, bbox.height / imgSize.height)
        : 0;

  const commit = useCallback(
    (deltaX: number, deltaY: number, scaleMul: number) => {
      if (!selectedId || !setting || !bbox) return;
      const noChange = deltaX === 0 && deltaY === 0 && scaleMul === 1;
      if (noChange) return;
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, setting.scale * scaleMul));
      pushHistory();
      upsertPieceSetting({
        polygonId: selectedId,
        fabricImageId: setting.fabricImageId,
        offsetX: setting.offsetX + deltaX / bbox.width,
        offsetY: setting.offsetY + deltaY / bbox.height,
        scale: nextScale,
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
          runOnJS(commit)(dx, dy, 1);
        }),
    [commit, liveOffsetX, liveOffsetY, startOffsetX, startOffsetY, vbPerPx],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          startScale.value = liveScale.value;
        })
        .onUpdate((e) => {
          liveScale.value = startScale.value * e.scale;
        })
        .onEnd(() => {
          const mul = liveScale.value;
          liveScale.value = 1;
          runOnJS(commit)(0, 0, mul);
        }),
    [commit, liveScale, startScale],
  );

  const composed = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  // 画像は自然ピクセルサイズで <image> を配置し、transform で配置・縮小する。
  // 0..1 単位の小さな width/height を直接渡すとラスタライズ精度が落ちるため。
  const animatedProps = useAnimatedProps(() => {
    if (!setting || !bbox || !imgSize || fitScale === 0) {
      return { transform: 'scale(0)' };
    }
    const drawScalePerPx = fitScale * setting.scale * liveScale.value;
    const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX) + liveOffsetX.value;
    const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY) + liveOffsetY.value;
    const tx = cx - (imgSize.width * drawScalePerPx) / 2;
    const ty = cy - (imgSize.height * drawScalePerPx) / 2;
    return { transform: `translate(${tx}, ${ty}) scale(${drawScalePerPx})` };
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
            if (setting.offsetX === 0 && setting.offsetY === 0 && setting.scale === 1) return;
            pushHistory();
            upsertPieceSetting({
              polygonId: setting.polygonId,
              fabricImageId: setting.fabricImageId,
              offsetX: 0,
              offsetY: 0,
              scale: 1,
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
