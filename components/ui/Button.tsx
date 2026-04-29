import { Pressable, StyleSheet, Text } from 'react-native';

import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({
  label,
  variant = 'primary',
  disabled = false,
  style,
  ...rest
}: ButtonProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: '#2563eb' },
    label: { color: '#fff' },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: '#e5e7eb' },
    label: { color: '#111827' },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: '#dc2626' },
    label: { color: '#fff' },
  }),
};
