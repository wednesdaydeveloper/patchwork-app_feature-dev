import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FabricImage } from '@/types/fabric';

export interface FabricListItemProps {
  fabric: FabricImage;
  onLongPress: (fabric: FabricImage) => void;
}

export const FabricListItem = ({ fabric, onLongPress }: FabricListItemProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fabric.name}
      onLongPress={() => onLongPress(fabric)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Image source={{ uri: fabric.imagePath }} style={styles.thumbnail} />
      <View style={styles.body}>
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
  );
};

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
  body: {
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
});
