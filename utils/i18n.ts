import { initReactI18next } from 'react-i18next';

import { getLocales } from 'expo-localization';

import i18n from 'i18next';

import type { LanguagePreference } from '@/atoms/settings';
import { en } from '@/locales/en';
import { ja } from '@/locales/ja';

export type SupportedLanguage = 'ja' | 'en';

/**
 * 端末ロケールから対応言語を判定する。
 * `ja*` は日本語、それ以外はすべて英語にフォールバック。
 */
export function detectSystemLanguage(): SupportedLanguage {
  const locales = getLocales();
  const code = locales[0]?.languageCode?.toLowerCase() ?? 'en';
  return code === 'ja' ? 'ja' : 'en';
}

/**
 * `LanguagePreference` を実際の言語コードに解決する（現在は恒等変換）。
 * 既存呼び出し元との互換性のために残す。
 */
export function resolveLanguage(preference: LanguagePreference): SupportedLanguage {
  return preference;
}

/**
 * i18next を初期化する。アプリ起動時に 1 度だけ呼び出す。
 */
export function initI18n(preference?: LanguagePreference): typeof i18n {
  if (i18n.isInitialized) {
    return i18n;
  }
  const lng = preference ?? detectSystemLanguage();
  void i18n.use(initReactI18next).init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
  return i18n;
}

/**
 * 言語を切り替える。`languagePreferenceAtom` の変化に追従して呼ぶ。
 */
export async function changeLanguage(preference: LanguagePreference): Promise<void> {
  if (i18n.language !== preference) {
    await i18n.changeLanguage(preference);
  }
}

export { i18n };
