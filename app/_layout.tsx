import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { Provider as JotaiProvider } from 'jotai';

import { NotificationHost } from '@/components/ui/NotificationHost';
import { useI18n } from '@/hooks/useI18n';
import { useOrientationLock } from '@/hooks/useOrientationLock';
import { initI18n } from '@/utils/i18n';

// `useTranslation()` は最初のレンダリング中に呼ばれるため、
// `useI18n` の `useEffect` が走る前に i18next を初期化しておく必要がある。
// ここでは端末ロケールで暫定初期化し、永続化されたユーザー設定は
// `useI18n` が `changeLanguage` で適用する。
initI18n();

function RootStack() {
  useI18n();
  useOrientationLock();
  const { t } = useTranslation();
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
