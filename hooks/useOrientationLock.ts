import { useEffect } from 'react';

import * as ScreenOrientation from 'expo-screen-orientation';

import { logger } from '@/utils/logger';

import { useDeviceSize } from './useDeviceSize';

/**
 * デバイス種別に応じて画面の向きをロックするフック。
 *
 * - phone: 縦向き(PORTRAIT_UP)
 * - tablet: 横向き(LANDSCAPE)
 *
 * `_layout.tsx` で 1 度だけ呼ぶ。`useDeviceSize` の結果が変わった場合
 * (理論上は起動後に変わらないが、外部 monitor 接続等で変わる可能性)も追従する。
 */
export function useOrientationLock(): void {
  const { kind } = useDeviceSize();

  useEffect(() => {
    const target =
      kind === 'tablet'
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(target).catch((error) => {
      logger.error('layout', 'failed to lock screen orientation', error, { kind });
    });
  }, [kind]);
}
