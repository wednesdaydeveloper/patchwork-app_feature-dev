import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export interface LoadingViewProps {
  label?: string;
}

export const LoadingView = ({ label }: LoadingViewProps) => {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={styles.container}
    >
      <ActivityIndicator size="large" color="#374151" />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
});
