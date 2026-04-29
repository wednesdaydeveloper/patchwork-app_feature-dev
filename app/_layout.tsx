import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Patchwork' }} />
      <Stack.Screen name="design-select" options={{ title: 'パターン選択' }} />
      <Stack.Screen name="editor/[id]" options={{ title: '編集' }} />
      <Stack.Screen name="export/[id]" options={{ title: 'エクスポート' }} />
      <Stack.Screen name="fabrics/index" options={{ title: '布地管理' }} />
      <Stack.Screen name="settings" options={{ title: '設定' }} />
    </Stack>
  );
}
