import React from 'react';

import { Provider, createStore } from 'jotai';
import { act, render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('@/utils/i18n', () => ({
  initI18n: jest.fn(),
  changeLanguage: jest.fn(async () => {}),
  detectSystemLanguage: jest.fn(() => 'en'),
}));

import * as i18nModule from '@/utils/i18n';

import { languagePreferenceAtom } from '@/atoms/settings';
import { useI18n } from '@/hooks/useI18n';

const mockInitI18n = i18nModule.initI18n as unknown as jest.Mock;
const mockChangeLanguage = i18nModule.changeLanguage as unknown as jest.Mock;
const mockDetectSystemLanguage = i18nModule.detectSystemLanguage as unknown as jest.Mock;

function Host() {
  useI18n();
  return null;
}

beforeEach(() => {
  mockChangeLanguage.mockClear();
  mockInitI18n.mockClear();
  mockDetectSystemLanguage.mockClear();
  mockDetectSystemLanguage.mockReturnValue('en');
});

describe('hooks/useI18n', () => {
  test('initializes i18n and applies preference', () => {
    const store = createStore();
    store.set(languagePreferenceAtom, 'ja');
    render(
      <Provider store={store}>
        <Host />
      </Provider>,
    );
    expect(mockInitI18n).toHaveBeenCalledWith('ja');
    expect(mockChangeLanguage).toHaveBeenCalledWith('ja');
  });

  test('migrates legacy "system" preference to detected language', () => {
    const store = createStore();
    // simulate legacy persisted value via type cast
    store.set(languagePreferenceAtom, 'system' as unknown as 'ja');
    render(
      <Provider store={store}>
        <Host />
      </Provider>,
    );
    expect(mockDetectSystemLanguage).toHaveBeenCalled();
    expect(store.get(languagePreferenceAtom)).toBe('en');
  });
});
