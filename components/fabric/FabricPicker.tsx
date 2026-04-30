import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FabricImage } from '@/types/fabric';

export interface FabricPickerProps {
  fabrics: readonly FabricImage[];
  selectedFabricId: string | null;
  onSelect: (fabric: FabricImage) => void;
  onAddFabric: () => void;
  /**
   * 'horizontal'(既定): 画面下部に横スクロールで並べる(スマホ縦持ち向け)
   * 'vertical': 縦スクロールの 2 列グリッドで並べる(タブレット横並び向け)
   */
  orientation?: 'horizontal' | 'vertical';
}

const ITEM_SIZE = 72;

/**
 * 編集画面の布地選択パネル。
 *
 * - 横モード: 下部に横スクロール一覧
 * - 縦モード: 右サイドバーに 2 列グリッド(タブレット用)
 * - タップで `onSelect` を発火(呼び出し側で `pieceSettingsAtom` 更新)
 * - 0 件時は布地管理画面への導線を表示
 */
export const FabricPicker = ({
  fabrics,
  selectedFabricId,
  onSelect,
  onAddFabric,
  orientation = 'horizontal',
}: FabricPickerProps) => {
  const { t } = useTranslation();
  const isVertical = orientation === 'vertical';

  if (fabrics.length === 0) {
    return (
      <View style={[styles.empty, isVertical && styles.emptyVertical]}>
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
    <View style={[styles.container, isVertical && styles.containerVertical]}>
      <Text style={styles.title}>{t('editor.selectFabric')}</Text>
      <FlatList
        key={`fabric-picker-${orientation}`}
        horizontal={!isVertical}
        numColumns={isVertical ? 2 : undefined}
        columnWrapperStyle={isVertical ? styles.columnWrapper : undefined}
        data={fabrics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FabricItem
            fabric={item}
            selected={item.id === selectedFabricId}
            onPress={() => onSelect(item)}
          />
        )}
        contentContainerStyle={isVertical ? styles.listContentVertical : styles.listContent}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
  containerVertical: {
    flex: 1,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
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
  listContentVertical: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 8,
  },
  columnWrapper: {
    gap: 8,
    justifyContent: 'space-between',
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
  emptyVertical: {
    flex: 1,
    justifyContent: 'center',
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
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
