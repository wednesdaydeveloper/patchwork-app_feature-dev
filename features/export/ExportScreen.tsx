import { StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

export const ExportScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>エクスポート</Text>
      <Text style={styles.meta}>ID: {id}</Text>
      <Text style={styles.placeholder}>画像保存 / 印刷用 PDF（実装予定 #37〜#39）</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
});
