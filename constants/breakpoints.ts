/**
 * デバイス分類の breakpoint(短辺 DP)。
 *
 * 600 DP 以上をタブレットと判定。Material Design / iOS の慣習に合わせる。
 * 短辺で判定することで回転中の一時的な誤判定を避ける。
 */
export const TABLET_MIN_SHORT_EDGE_DP = 600;

export type DeviceKind = 'phone' | 'tablet';

/**
 * 画面の幅・高さから phone / tablet を判定する純粋関数。
 * テスト容易性のため hook と分離して提供する。
 */
export function classifyDevice(width: number, height: number): DeviceKind {
  const shortEdge = Math.min(width, height);
  return shortEdge >= TABLET_MIN_SHORT_EDGE_DP ? 'tablet' : 'phone';
}
