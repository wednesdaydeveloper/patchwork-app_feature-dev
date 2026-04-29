import { useEffect } from 'react';

import { useAtomValue } from 'jotai';

import { languagePreferenceAtom } from '@/atoms/settings';
import { changeLanguage, initI18n } from '@/utils/i18n';

/**
 * i18next の初期化と `languagePreferenceAtom` への追従を行うフック。
 * ルート（`app/_layout.tsx`）で 1 度だけ使う想定。
 */
export function useI18n(): void {
  const preference = useAtomValue(languagePreferenceAtom);

  useEffect(() => {
    initI18n(preference);
    void changeLanguage(preference);
  }, [preference]);
}
