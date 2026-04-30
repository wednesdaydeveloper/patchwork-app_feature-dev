import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
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

/**
 * 調整モードのオーバーレイ。選択中ピースを拡大表示し、ジェスチャで位置・回転を調整する。
 *
 * - 1 本指パン: 位置調整
 * - 2 本指回転: 画像中心まわりの回転（拡大縮小は無効）
 * - ジェスチャー終了時に `pieceSettingsAtom` へコミット
 *
 * 描画は通常の React state を使用。reanimated の `animatedProps` で SVG の
 * `transform` 文字列を渡す方式は react-native-svg のパース経路で壊れるケースが
 * あったため不採用（`PieceImage` と同様の静的 transform 文字列で記述する）。
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

  // ジェスチャ中の差分(viewBox 単位 / ラジアン)。state なので変更で再描画。
  const [liveOffsetX, setLiveOffsetX] = useState(0);
  const [liveOffsetY, setLiveOffsetY] = useState(0);
  const [liveRotation, setLiveRotation] = useState(0);
  // gesture onStart 時のスナップショット。state のクロージャ問題を避けるため ref に保持。
  const startOffsetX = useRef(0);
  const startOffsetY = useRef(0);
  const startRotation = useRef(0);
  // commit 時に最新値を読むため ref に同期しておく。
  const liveOffsetXRef = useRef(0);
  const liveOffsetYRef = useRef(0);
  const liveRotationRef = useRef(0);

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

  const updateOffset = useCallback((x: number, y: number) => {
    liveOffsetXRef.current = x;
    liveOffsetYRef.current = y;
    setLiveOffsetX(x);
    setLiveOffsetY(y);
  }, []);

  const updateRotation = useCallback((r: number) => {
    liveRotationRef.current = r;
    setLiveRotation(r);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
          startOffsetX.current = liveOffsetXRef.current;
          startOffsetY.current = liveOffsetYRef.current;
        })
        .onUpdate((e) => {
          updateOffset(
            startOffsetX.current + e.translationX * vbPerPx,
            startOffsetY.current + e.translationY * vbPerPx,
          );
        })
        .onEnd(() => {
          const dx = liveOffsetXRef.current;
          const dy = liveOffsetYRef.current;
          updateOffset(0, 0);
          commit(dx, dy, 0);
        }),
    [commit, updateOffset, vbPerPx],
  );

  const rotationGesture = useMemo(
    () =>
      Gesture.Rotation()
        .runOnJS(true)
        .onStart(() => {
          startRotation.current = liveRotationRef.current;
        })
        .onUpdate((e) => {
          updateRotation(startRotation.current + e.rotation);
        })
        .onEnd(() => {
          const dr = liveRotationRef.current;
          updateRotation(0);
          commit(0, 0, dr);
        }),
    [commit, updateRotation],
  );

  const composed = useMemo(
    () => Gesture.Simultaneous(panGesture, rotationGesture),
    [panGesture, rotationGesture],
  );

  if (!adjustMode || !design || !selectedId || !polygon || !bbox) {
    return null;
  }

  // 画像 transform: 画像中心まわりの回転 + ピース座標系への配置
  const renderImage = setting && fabric && imgSize && drawScalePerPx > 0;
  const imageTransform = renderImage
    ? (() => {
        const cx = bbox.minX + bbox.width * (0.5 + setting.offsetX) + liveOffsetX;
        const cy = bbox.minY + bbox.height * (0.5 + setting.offsetY) + liveOffsetY;
        const rotationDeg = ((setting.rotation + liveRotation) * 180) / Math.PI;
        return (
          `translate(${cx}, ${cy}) ` +
          `rotate(${rotationDeg}) ` +
          `scale(${drawScalePerPx}) ` +
          `translate(${-imgSize.width / 2}, ${-imgSize.height / 2})`
        );
      })()
    : '';

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
            {renderImage && (
              <G clipPath={`url(#adjust-clip-${polygon.id})`}>
                <SvgImage
                  href={fabric.imagePath}
                  x={0}
                  y={0}
                  width={imgSize.width}
                  height={imgSize.height}
                  preserveAspectRatio="xMidYMid slice"
                  transform={imageTransform}
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
