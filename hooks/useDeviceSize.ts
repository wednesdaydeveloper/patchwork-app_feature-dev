import { useWindowDimensions } from 'react-native';

import { classifyDevice, type DeviceKind } from '@/constants/breakpoints';

export interface DeviceSize {
  kind: DeviceKind;
  width: number;
  height: number;
  isLandscape: boolean;
}

/**
 * 画面サイズから phone / tablet を判定するフック。
 *
 * - 短辺が `TABLET_MIN_SHORT_EDGE_DP`（600 DP）以上のとき tablet
 * - `useWindowDimensions` を使うので回転やマルチタスク変更にも追従する
 */
export function useDeviceSize(): DeviceSize {
  const { width, height } = useWindowDimensions();
  return {
    kind: classifyDevice(width, height),
    width,
    height,
    isLandscape: width > height,
  };
}
