import { StyleSheet, Text, View } from 'react-native';

import { Link } from 'expo-router';

export const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patchwork</Text>
      <Link href="/design-select" style={styles.link}>
        新規パッチワークを作成
      </Link>
      <Link href="/fabrics" style={styles.link}>
        布地管理
      </Link>
      <Link href="/settings" style={styles.link}>
        設定
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  link: {
    fontSize: 16,
    color: '#2563eb',
    paddingVertical: 8,
  },
});
