/**
 * 印刷ダイアログでユーザーがキャンセルした場合に `expo-print` が throw する
 * `ERR_PRINT_INCOMPLETE` エラーを判別する。
 *
 * ユーザー意図のキャンセルは失敗ではないため、エラー扱いせず silent で終了する。
 * (CLAUDE.md「エラーハンドリング方針」参照)
 */
export function isUserCancelledPrint(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === 'ERR_PRINT_INCOMPLETE';
}
