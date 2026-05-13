import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { Provider as JotaiProvider, useSetAtom } from 'jotai';

import type { LanguagePreference } from '@/atoms/settings';
import { loadFabricsAtom } from '@/atoms/fabrics';
import { NotificationHost } from '@/components/ui/NotificationHost';
import { useI18n } from '@/hooks/useI18n';
import { useOrientationLock } from '@/hooks/useOrientationLock';
import { initI18n } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import { seedInitialFabricsIfNeeded } from '@/utils/seedFabrics';

// languagePreferenceAtom（atoms/settings.ts）が AsyncStorage に保存するキー
const LANGUAGE_PREFERENCE_KEY = 'settings.languagePreference';

function RootStack() {
  useI18n();
  useOrientationLock();
  const { t } = useTranslation();
  const loadFabrics = useSetAtom(loadFabricsAtom);

  useEffect(() => {
    void (async () => {
      await seedInitialFabricsIfNeeded().catch((e) => {
        logger.warn('layout', 'プリセット布地の初期登録に失敗しました', undefined, e);
      });
      await loadFabrics();
    })();
  }, [loadFabrics]);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: t('home.title') }} />
        <Stack.Screen name="design-select" options={{ title: t('designSelect.title') }} />
        <Stack.Screen name="new-work/size" options={{ title: t('newWorkSize.title') }} />
        <Stack.Screen name="editor/[id]" options={{ title: t('editor.title') }} />
        <Stack.Screen name="export/[id]" options={{ title: t('exportScreen.title') }} />
        <Stack.Screen name="fabrics/index" options={{ title: t('fabrics.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      </Stack>
      <NotificationHost />
    </>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // `useTranslation()` は最初のレンダリング中に呼ばれるため、
    // RootStack をレンダリングする前に i18next を初期化する必要がある。
    // AsyncStorage から永続化された言語設定を読み込み、ユーザー設定が
    // 端末ロケールと異なる場合も初回から正しい言語で表示できるようにする。
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
        const preference = stored ? (JSON.parse(stored) as LanguagePreference) : null;
        initI18n(preference === 'ja' || preference === 'en' ? preference : undefined);
      } catch (e) {
        logger.warn('i18n', 'AsyncStorage からの言語設定読み込みに失敗しました。端末ロケールで初期化します。', undefined, e);
        initI18n();
      }
      setI18nReady(true);
    })();
  }, []);

  if (!i18nReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <JotaiProvider>
          <RootStack />
        </JotaiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
