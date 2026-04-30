import AsyncStorage from '@react-native-async-storage/async-storage';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { detectSystemLanguage } from '@/utils/i18n';

export type LanguagePreference = 'ja' | 'en';

const storage = createJSONStorage<LanguagePreference>(() => AsyncStorage);

/**
 * ユーザーが選択した言語設定（'ja' または 'en'）。
 *
 * 初期値は端末ロケールから自動判定（ja → 'ja'、それ以外 → 'en'）。
 * 過去バージョンで保存された `'system'` 値は `useI18n` の起動時マイグレーションで
 * 自動的に検出言語へ書き換えられる。
 */
export const languagePreferenceAtom = atomWithStorage<LanguagePreference>(
  'settings.languagePreference',
  detectSystemLanguage(),
  storage,
);
languagePreferenceAtom.debugLabel = 'languagePreference';
