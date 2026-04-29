import { StyleSheet, Text, View } from 'react-native';

export const FabricsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>布地管理</Text>
      <Text style={styles.placeholder}>登録一覧 + 登録・削除（実装予定 #23〜#25）</Text>
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
