const mockGetLocales = jest.fn<{ languageCode: string | null }[], []>();

jest.mock('expo-localization', () => ({
  getLocales: () => mockGetLocales(),
}));

import { detectSystemLanguage, resolveLanguage } from '@/utils/i18n';

beforeEach(() => {
  mockGetLocales.mockReset();
});

describe('utils/i18n detectSystemLanguage', () => {
  test('returns ja for Japanese locale', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'ja' }]);
    expect(detectSystemLanguage()).toBe('ja');
  });

  test('returns ja for uppercase JA', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'JA' }]);
    expect(detectSystemLanguage()).toBe('ja');
  });

  test('returns en for English locale', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    expect(detectSystemLanguage()).toBe('en');
  });

  test('returns en for any non-Japanese locale', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'fr' }]);
    expect(detectSystemLanguage()).toBe('en');
  });

  test('returns en when locale is unavailable', () => {
    mockGetLocales.mockReturnValue([]);
    expect(detectSystemLanguage()).toBe('en');
  });

  test('returns en when languageCode is null', () => {
    mockGetLocales.mockReturnValue([{ languageCode: null }]);
    expect(detectSystemLanguage()).toBe('en');
  });
});

describe('utils/i18n resolveLanguage', () => {
  test('returns the same preference (identity)', () => {
    expect(resolveLanguage('ja')).toBe('ja');
    expect(resolveLanguage('en')).toBe('en');
  });
});
