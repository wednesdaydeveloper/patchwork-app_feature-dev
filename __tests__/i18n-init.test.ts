jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

import { changeLanguage, i18n, initI18n } from '@/utils/i18n';

describe('utils/i18n initI18n / changeLanguage', () => {
  test('initI18n initializes i18next and is idempotent', () => {
    const first = initI18n('ja');
    expect(first.isInitialized).toBe(true);
    // calling again should not re-initialize
    const second = initI18n('en');
    expect(second).toBe(first);
  });

  test('changeLanguage updates i18n.language', async () => {
    initI18n('ja');
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
    // calling again with the same language is a no-op
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
  });
});
