import { Pressable, StyleSheet, Text } from 'react-native';

import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /**
   * 表示するアイコン文字列（絵文字や 1〜2 文字記号を想定。`react-native-vector-icons` 等を
   * 入れる前のシンプルな繋ぎ実装）。
   */
  icon: string;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconButton = ({
  icon,
  accessibilityLabel,
  disabled = false,
  style,
  ...rest
}: IconButtonProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  icon: {
    fontSize: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
