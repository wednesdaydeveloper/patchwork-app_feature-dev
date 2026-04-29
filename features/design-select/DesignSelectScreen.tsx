import { StyleSheet, Text, View } from 'react-native';

export const DesignSelectScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>パターン選択</Text>
      <Text style={styles.placeholder}>パターン一覧（実装予定 #26）</Text>
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
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
});
