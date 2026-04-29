import { useCallback, useEffect, useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAtomValue, useSetAtom } from 'jotai';

import { fabricsAtom, fabricsLoadedAtom, loadFabricsAtom, removeFabricAtom } from '@/atoms/fabrics';
import { showDialogAtom, showToastAtom } from '@/atoms/notification';
import { Button } from '@/components/ui/Button';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { FabricListItem } from '@/features/fabrics/FabricListItem';
import { useFabricRegister } from '@/features/fabrics/useFabricRegister';
import type { FabricImage } from '@/types/fabric';

interface Section {
  title: string;
  data: FabricImage[];
}

export const FabricsScreen = () => {
  const { t } = useTranslation();
  const fabrics = useAtomValue(fabricsAtom);
  const loaded = useAtomValue(fabricsLoadedAtom);
  const loadFabrics = useSetAtom(loadFabricsAtom);
  const removeFabric = useSetAtom(removeFabricAtom);
  const showDialog = useSetAtom(showDialogAtom);
  const showToast = useSetAtom(showToastAtom);
  const register = useFabricRegister();

  useEffect(() => {
    loadFabrics().catch(() => {
      showToast({ message: t('error.workLoadFailed'), variant: 'error' });
    });
  }, [loadFabrics, showToast, t]);

  const sections = useMemo<Section[]>(() => {
    const groups = new Map<string, FabricImage[]>();
    for (const fabric of fabrics) {
      const key = fabric.category.trim();
      const list = groups.get(key) ?? [];
      list.push(fabric);
      groups.set(key, list);
    }
    const result: Section[] = [];
    for (const [key, data] of groups) {
      result.push({ title: key.length > 0 ? key : t('fabrics.uncategorized'), data });
    }
    // 「未分類」を末尾に
    result.sort((a, b) => {
      const ua = t('fabrics.uncategorized');
      if (a.title === ua) return 1;
      if (b.title === ua) return -1;
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [fabrics, t]);

  const performDelete = useCallback(
    async (fabric: FabricImage, force: boolean) => {
      try {
        const result = await removeFabric({ id: fabric.id, force });
        if (result.referenced && !result.removed) {
          showDialog({
            title: t('fabrics.deleteConfirmTitle'),
            message: t('fabrics.deleteWarnReferenced'),
            actions: [
              {
                label: t('fabrics.forceDelete'),
                variant: 'danger',
                onPress: () => {
                  void performDelete(fabric, true);
                },
              },
              {
                label: t('common.cancel'),
                variant: 'secondary',
                onPress: () => undefined,
              },
            ],
            dismissOnBackdrop: true,
          });
        }
      } catch {
        showToast({ message: t('fabrics.deleteFailed'), variant: 'error' });
      }
    },
    [removeFabric, showDialog, showToast, t],
  );

  const handleLongPress = useCallback(
    (fabric: FabricImage) => {
      showDialog({
        title: t('fabrics.deleteConfirmTitle'),
        message: t('fabrics.deleteConfirm'),
        actions: [
          {
            label: t('common.delete'),
            variant: 'danger',
            onPress: () => {
              void performDelete(fabric, false);
            },
          },
          {
            label: t('common.cancel'),
            variant: 'secondary',
            onPress: () => undefined,
          },
        ],
        dismissOnBackdrop: true,
      });
    },
    [showDialog, performDelete, t],
  );

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button label={t('fabrics.fromCamera')} onPress={() => void register.pick('camera')} />
        <Button
          label={t('fabrics.fromLibrary')}
          variant="secondary"
          onPress={() => void register.pick('library')}
        />
      </View>

      {loaded && fabrics.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyMessage}>{t('fabrics.empty')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FabricListItem fabric={item} onLongPress={handleLongPress} />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      <PromptDialog
        visible={register.pending !== null}
        title={t('fabrics.registerTitle')}
        fields={[
          {
            key: 'name',
            placeholder: t('fabrics.namePlaceholder'),
            autoFocus: true,
          },
          {
            key: 'category',
            placeholder: t('fabrics.categoryPlaceholder'),
          },
        ]}
        onSubmit={(values) => {
          void register.confirm(values.name ?? '', values.category ?? '');
        }}
        onCancel={register.cancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f9fafb',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
