import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

import { showDialogAtom } from '@/atoms/notification';
import { useSetAtom } from 'jotai';

import { Button } from '@/components/ui/Button';
import { loadDesigns } from '@/constants/designs';
import { DesignThumbnail } from '@/features/design-select/DesignThumbnail';
import { useDesignName } from '@/hooks/useDesignName';
import { useDeviceSize } from '@/hooks/useDeviceSize';
import type { Design } from '@/types/design';
import { logger } from '@/utils/logger';

interface Section {
  title: string;
  data: Design[][];
}

const PHONE_COLUMNS = 2;
const TABLET_COLUMNS = 4;

export const DesignSelectScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const showDialog = useSetAtom(showDialogAtom);
  const { kind } = useDeviceSize();
  const columns = kind === 'tablet' ? TABLET_COLUMNS : PHONE_COLUMNS;

  const designs = useMemo(() => {
    try {
      return loadDesigns();
    } catch (error) {
      logger.error('designs', 'failed to load designs', error);
      // 起動時にも検証されるが、念のためダイアログで通知
      showDialog({
        title: t('common.confirm'),
        message: t('error.designParseFailed'),
        actions: [
          {
            label: t('common.back'),
            onPress: () => router.back(),
          },
        ],
      });
      return [];
    }
  }, [router, showDialog, t]);

  const sections = useMemo<Section[]>(() => {
    const groups = new Map<string, Design[]>();
    for (const design of designs) {
      const key = design.category;
      const list = groups.get(key) ?? [];
      list.push(design);
      groups.set(key, list);
    }
    const result: Section[] = [];
    for (const [key, list] of groups) {
      result.push({ title: t(`category.${key}`, { defaultValue: key }), data: chunk(list, columns) });
    }
    result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [designs, t, columns]);

  const handleSelect = (design: Design) => {
    router.push({ pathname: '/new-work/size', params: { designId: design.id } });
  };

  if (designs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyMessage}>{t('designSelect.empty')}</Text>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(row, index) => row.map((d) => d.id).join('-') + index}
      renderItem={({ item: row }) => (
        <View style={styles.row}>
          {row.map((design) => (
            <DesignCard key={design.id} design={design} onPress={handleSelect} />
          ))}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={styles.cardSpacer} />
            ))}
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
    />
  );
};

interface DesignCardProps {
  design: Design;
  onPress: (design: Design) => void;
}

const DesignCard = ({ design, onPress }: DesignCardProps) => {
  const name = useDesignName(design);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(design)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <DesignThumbnail design={design} size={140} />
      <Text style={styles.cardName} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
};

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 8,
  },
  cardSpacer: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
