jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'ja' }],
}));

import { createStore } from 'jotai';

import { languagePreferenceAtom } from '@/atoms/settings';

describe('atoms/settings languagePreferenceAtom', () => {
  test('reads initial value from detected system language (ja)', () => {
    const store = createStore();
    expect(store.get(languagePreferenceAtom)).toBe('ja');
  });

  test('can be updated to en', () => {
    const store = createStore();
    store.set(languagePreferenceAtom, 'en');
    expect(store.get(languagePreferenceAtom)).toBe('en');
  });
});
