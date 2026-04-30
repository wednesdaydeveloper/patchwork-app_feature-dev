import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image as RNImage,
  Modal,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { useImageSize } from '@/hooks/useImageSize';

/** mm 1 つを何 DP で描画するか（Android baseline 160dpi 想定）。 */
export const DP_PER_MM = 160 / 25.4; // ≈ 6.299

/** ルーラの最大目盛 mm */
const RULER_MAX_MM = 150;
/** 大目盛間隔 mm */
const RULER_MAJOR_MM = 10;
/** 小目盛間隔 mm */
const RULER_MINOR_MM = 1;

/** 画像幅をライブ表示するために shared value を JS 側 state に反映するためのデバウンス間隔 */
const LIVE_UPDATE_INTERVAL_MS = 80;

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;

export interface CalibrationScreenProps {
  visible: boolean;
  imageUri: string;
  /** 「保存」確定時。`pxPerMm` を渡す。 */
  onConfirm: (pxPerMm: number) => void;
  onCancel: () => void;
}

/**
 * 布地キャリブレーション画面。
 *
 * 画面上部に固定の物理サイズ目盛り（ルーラ）を表示し、ユーザーは画像をピンチ／パンで
 * ルーラに合わせる。確定時に「画像 1mm あたりの px 数 = imagePx.w / 表示 mm 幅」を保存。
 *
 * 機種により実 DPI が ±5% 程度ずれることに注意（Android 160dpi ベース換算）。
 */
export const CalibrationScreen = ({
  visible,
  imageUri,
  onConfirm,
  onCancel,
}: CalibrationScreenProps) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const imageSize = useImageSize(imageUri);

  const initialDisplayWidth = useMemo(
    () => Math.min(screenWidth - 48, RULER_MAX_MM * DP_PER_MM),
    [screenWidth],
  );

  const initialScale = useMemo(() => {
    if (!imageSize || imageSize.width === 0) return 1;
    return initialDisplayWidth / imageSize.width;
  }, [imageSize, initialDisplayWidth]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ライブ表示用 mm 幅（ジェスチャ中に間引いて更新）
  const [displayMmW, setDisplayMmW] = useState(0);

  // imageSize 確定時に初期 scale を反映（render 中に shared value を書かないため effect で）
  useEffect(() => {
    scale.value = initialScale;
    savedScale.value = initialScale;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    if (imageSize) {
      setDisplayMmW((imageSize.width * initialScale) / DP_PER_MM);
    }
  }, [
    initialScale,
    imageSize,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);
  const lastUpdateRef = useRef(0);
  const reportMmW = useCallback((value: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= LIVE_UPDATE_INTERVAL_MS) {
      lastUpdateRef.current = now;
      setDisplayMmW(value);
    }
  }, []);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;
      if (imageSize) {
        runOnJS(reportMmW)((imageSize.width * next) / DP_PER_MM);
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = () => {
    if (!imageSize) return;
    const mmW = (imageSize.width * scale.value) / DP_PER_MM;
    if (!Number.isFinite(mmW) || mmW <= 0) return;
    const pxPerMm = imageSize.width / mmW;
    onConfirm(pxPerMm);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('fabrics.calibrationTitle')}</Text>
          <Text style={styles.hint}>{t('fabrics.calibrationHint')}</Text>
        </View>

        <Ruler />

        <View style={styles.imageArea}>
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
              {imageSize && (
                <RNImage
                  source={{ uri: imageUri }}
                  style={{ width: imageSize.width, height: imageSize.height }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          </GestureDetector>
        </View>

        <View style={styles.footer}>
          <Text style={styles.live}>
            {t('fabrics.imageWidthMm', { mm: displayMmW.toFixed(1) })}
          </Text>
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
            <Button label={t('common.save')} onPress={handleConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * 物理 mm ベースの目盛りを描画する。
 * 0..RULER_MAX_MM、大目盛 RULER_MAJOR_MM、小目盛 RULER_MINOR_MM。
 */
const Ruler = () => {
  const items = useMemo(() => {
    const ticks: { x: number; major: boolean; label?: number }[] = [];
    for (let mm = 0; mm <= RULER_MAX_MM; mm += RULER_MINOR_MM) {
      const major = mm % RULER_MAJOR_MM === 0;
      ticks.push({ x: mm * DP_PER_MM, major, label: major ? mm : undefined });
    }
    return ticks;
  }, []);

  return (
    <View style={styles.rulerWrap}>
      <View style={[styles.rulerBar, { width: RULER_MAX_MM * DP_PER_MM }]}>
        {items.map((tick, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              { left: tick.x, height: tick.major ? 16 : 8 },
            ]}
          />
        ))}
        {items
          .filter((t) => t.label !== undefined && t.label % RULER_MAJOR_MM === 0)
          .map((t) => (
            <Text
              key={`l-${t.label}`}
              style={[styles.tickLabel, { left: t.x - 8 }]}
            >
              {t.label}
            </Text>
          ))}
      </View>
    </View>
  );
};

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 18,
  },
  rulerWrap: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  rulerBar: {
    height: 28,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    backgroundColor: '#374151',
  },
  tickLabel: {
    position: 'absolute',
    top: -2,
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
    width: 16,
    textAlign: 'center',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#1f2937',
  },
  live: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
});
