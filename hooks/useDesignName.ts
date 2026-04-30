import { useTranslation } from 'react-i18next';

import type { Design } from '@/types/design';

/**
 * ロケールに応じてパターン名を返す純粋関数。テスト容易性のため hook と分離。
 */
export function getDesignName(design: Design, language: string): string {
  return language === 'ja' ? design.nameJa : design.name;
}

/**
 * ロケールに応じてパターン名を返す。
 * - `i18n.language === 'ja'` → `design.nameJa`
 * - それ以外 → `design.name`
 */
export function useDesignName(design: Design): string {
  const { i18n } = useTranslation();
  return getDesignName(design, i18n.language);
}
