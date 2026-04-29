import { StyleSheet, Text, View } from 'react-native';

export const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>設定</Text>
      <Text style={styles.placeholder}>言語切替（実装予定 #40）</Text>
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
