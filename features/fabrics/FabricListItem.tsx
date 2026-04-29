import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FabricImage } from '@/types/fabric';

export interface FabricListItemProps {
  fabric: FabricImage;
  /** タップ時(編集ダイアログを開く想定) */
  onPress?: (fabric: FabricImage) => void;
  /** ︙ メニューボタン押下時 */
  onMenu?: (fabric: FabricImage) => void;
  menuAccessibilityLabel?: string;
}

const FabricListItemImpl = ({
  fabric,
  onPress,
  onMenu,
  menuAccessibilityLabel,
}: FabricListItemProps) => {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fabric.name}
        onPress={onPress ? () => onPress(fabric) : undefined}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Image source={{ uri: fabric.imagePath }} style={styles.thumbnail} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {fabric.name}
          </Text>
          {fabric.category.length > 0 && (
            <Text style={styles.category} numberOfLines={1}>
              {fabric.category}
            </Text>
          )}
        </View>
      </Pressable>
      {onMenu && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menuAccessibilityLabel}
          onPress={() => onMenu(fabric)}
          style={({ pressed }) => [styles.menu, pressed && styles.pressed]}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </Pressable>
      )}
    </View>
  );
};

export const FabricListItem = memo(FabricListItemImpl);
FabricListItem.displayName = 'FabricListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 6,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  menu: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuIcon: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '700',
  },
});
