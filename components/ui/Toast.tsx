import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** 任意のアクションボタン（例: 「再試行」） */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

/**
 * 単一トーストの表示コンポーネント。
 * 表示・非表示制御は `NotificationHost` 側で行う想定。
 */
export const Toast = ({ message, variant = 'info', actionLabel, onAction }: ToastProps) => {
  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, variantStyles[variant].container]}
    >
      <Text style={[styles.message, variantStyles[variant].message]}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={[styles.actionLabel, variantStyles[variant].message]}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});

const variantStyles = {
  info: StyleSheet.create({
    container: { backgroundColor: '#1f2937' },
    message: { color: '#fff' },
  }),
  success: StyleSheet.create({
    container: { backgroundColor: '#16a34a' },
    message: { color: '#fff' },
  }),
  error: StyleSheet.create({
    container: { backgroundColor: '#b91c1c' },
    message: { color: '#fff' },
  }),
};
