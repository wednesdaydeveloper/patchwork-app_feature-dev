import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { Provider as JotaiProvider } from 'jotai';

import { NotificationHost } from '@/components/ui/NotificationHost';
import { useI18n } from '@/hooks/useI18n';

function RootStack() {
  useI18n();
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Patchwork' }} />
        <Stack.Screen name="design-select" options={{ title: 'パターン選択' }} />
        <Stack.Screen name="editor/[id]" options={{ title: '編集' }} />
        <Stack.Screen name="export/[id]" options={{ title: 'エクスポート' }} />
        <Stack.Screen name="fabrics/index" options={{ title: '布地管理' }} />
        <Stack.Screen name="settings" options={{ title: '設定' }} />
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
