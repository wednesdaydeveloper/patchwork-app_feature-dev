import AsyncStorage from '@react-native-async-storage/async-storage';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

export type LanguagePreference = 'system' | 'ja' | 'en';

const storage = createJSONStorage<LanguagePreference>(() => AsyncStorage);

/**
 * ユーザーが選択した言語設定。
 * `'system'` の場合は端末ロケールに従う（解決は utils/i18n で実施、#16）。
 */
export const languagePreferenceAtom = atomWithStorage<LanguagePreference>(
  'settings.languagePreference',
  'system',
  storage,
);
languagePreferenceAtom.debugLabel = 'languagePreference';
