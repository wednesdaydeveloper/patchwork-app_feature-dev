import type { SupportedLanguage } from '@/utils/i18n';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * ロケール別の日付フォーマット。
 * - `ja`: `yyyy/MM/dd`
 * - `en`: `yyyy-MM-dd`
 *
 * `Intl.DateTimeFormat` を使うとロケール依存の区切り文字が安定しないため、
 * 仕様で指定された書式を厳密に再現するため手動フォーマットする。
 */
export function formatDate(date: Date, language: SupportedLanguage): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return language === 'ja' ? `${y}/${m}/${d}` : `${y}-${m}-${d}`;
}
