import { useTranslation } from 'react-i18next';

import type { Design } from '@/types/design';

/**
 * ロケールに応じてパターン名を返す。
 * - `i18n.language === 'ja'` → `design.nameJa`
 * - それ以外 → `design.name`
 */
export function useDesignName(design: Design): string {
  const { i18n } = useTranslation();
  return i18n.language === 'ja' ? design.nameJa : design.name;
}
