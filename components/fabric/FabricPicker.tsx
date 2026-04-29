import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FabricImage } from '@/types/fabric';

export interface FabricPickerProps {
  fabrics: readonly FabricImage[];
  selectedFabricId: string | null;
  onSelect: (fabric: FabricImage) => void;
  onAddFabric: () => void;
}

const ITEM_SIZE = 72;

/**
 * 編集画面下部に表示する布地選択パネル。
 *
 * - 登録済み布地を横スクロール一覧で表示
 * - タップで `onSelect` を発火（呼び出し側で `pieceSettingsAtom` 更新）
 * - 0 件時は布地管理画面への導線を表示
 */
export const FabricPicker = ({
  fabrics,
  selectedFabricId,
  onSelect,
  onAddFabric,
}: FabricPickerProps) => {
  const { t } = useTranslation();

  if (fabrics.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyMessage}>{t('fabrics.empty')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.fabrics')}
          onPress={onAddFabric}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonLabel}>{t('home.fabrics')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('editor.selectFabric')}</Text>
      <FlatList
        horizontal
        data={fabrics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FabricItem
            fabric={item}
            selected={item.id === selectedFabricId}
            onPress={() => onSelect(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

interface FabricItemProps {
  fabric: FabricImage;
  selected: boolean;
  onPress: () => void;
}

const FabricItem = ({ fabric, selected, onPress }: FabricItemProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fabric.name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        selected && styles.itemSelected,
        pressed && styles.pressed,
      ]}
    >
      <Image source={{ uri: fabric.imagePath }} style={styles.thumbnail} />
      <Text style={styles.name} numberOfLines={1}>
        {fabric.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    width: ITEM_SIZE,
    alignItems: 'center',
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  thumbnail: {
    width: ITEM_SIZE - 16,
    height: ITEM_SIZE - 16,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 11,
    color: '#374151',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
