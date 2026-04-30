import { memo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import type { FabricImage } from '@/types/fabric';

export interface FabricListItemProps {
  fabric: FabricImage;
  /** タップ時(編集ダイアログを開く想定) */
  onPress?: (fabric: FabricImage) => void;
  /** スワイプ削除ボタン押下時 */
  onDelete?: (fabric: FabricImage) => void;
  deleteAccessibilityLabel?: string;
}

const FabricListItemImpl = ({
  fabric,
  onPress,
  onDelete,
  deleteAccessibilityLabel,
}: FabricListItemProps) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = onDelete
    ? () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteAccessibilityLabel}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(fabric);
          }}
          style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
        >
          <Text style={styles.deleteActionLabel}>{deleteAccessibilityLabel}</Text>
        </Pressable>
      )
    : undefined;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fabric.name}
        onPress={onPress ? () => onPress(fabric) : undefined}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
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
    </Swipeable>
  );
};

export const FabricListItem = memo(FabricListItemImpl);
FabricListItem.displayName = 'FabricListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 6,
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
  deleteAction: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 6,
    borderRadius: 10,
  },
  deleteActionPressed: {
    opacity: 0.8,
  },
  deleteActionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
