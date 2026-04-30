import { useEffect } from 'react';

import { useAtom } from 'jotai';

import { languagePreferenceAtom } from '@/atoms/settings';
import { changeLanguage, detectSystemLanguage, initI18n } from '@/utils/i18n';

/**
 * i18next の初期化と `languagePreferenceAtom` への追従を行うフック。
 * ルート（`app/_layout.tsx`）で 1 度だけ使う想定。
 *
 * 過去バージョンで保存された `'system'` 値や型外の値は起動時に検出言語へ書き換える。
 */
export function useI18n(): void {
  const [preference, setPreference] = useAtom(languagePreferenceAtom);

  useEffect(() => {
    // 旧バージョンの 'system' 値や型外の値を検出言語へ移行
    if (preference !== 'ja' && preference !== 'en') {
      setPreference(detectSystemLanguage());
      return;
    }
    initI18n(preference);
    void changeLanguage(preference);
  }, [preference, setPreference]);
}
