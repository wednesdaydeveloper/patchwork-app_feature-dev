import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  fabricsAtom,
  fabricsLoadedAtom,
  loadFabricsAtom,
  removeFabricAtom,
  updateFabricAtom,
} from '@/atoms/fabrics';
import { showDialogAtom, showToastAtom } from '@/atoms/notification';
import { Button } from '@/components/ui/Button';
import { LoadingView } from '@/components/ui/LoadingView';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { CalibrationScreen } from '@/features/fabrics/CalibrationScreen';
import { FabricListItem } from '@/features/fabrics/FabricListItem';
import { useFabricRegister } from '@/features/fabrics/useFabricRegister';
import type { FabricImage } from '@/types/fabric';
import { logger } from '@/utils/logger';

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
  const updateFabricMeta = useSetAtom(updateFabricAtom);
  const [editingFabric, setEditingFabric] = useState<FabricImage | null>(null);
  const [recalibrateTarget, setRecalibrateTarget] = useState<FabricImage | null>(null);
  const showDialog = useSetAtom(showDialogAtom);
  const showToast = useSetAtom(showToastAtom);
  const register = useFabricRegister();

  useEffect(() => {
    loadFabrics().catch((error) => {
      logger.error('fabrics', 'failed to load fabrics', error);
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
      } catch (error) {
        logger.error('fabrics', 'failed to delete fabric', error, { fabricId: fabric.id, force });
        showToast({ message: t('fabrics.deleteFailed'), variant: 'error' });
      }
    },
    [removeFabric, showDialog, showToast, t],
  );

  const handleDeleteRequest = useCallback(
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


  const hasUncalibrated = useMemo(
    () => fabrics.some((f) => f.pxPerMm == null),
    [fabrics],
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

      {hasUncalibrated && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{t('fabrics.uncalibratedWarning')}</Text>
        </View>
      )}

      {!loaded ? (
        <LoadingView label={t('common.loading')} />
      ) : fabrics.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyMessage}>{t('fabrics.empty')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FabricListItem
              fabric={item}
              onPress={setEditingFabric}
              onDelete={handleDeleteRequest}
              deleteAccessibilityLabel={t('common.delete')}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      <PromptDialog
        visible={editingFabric !== null}
        title={t('fabrics.editTitle')}
        fields={[
          {
            key: 'name',
            placeholder: t('fabrics.namePlaceholder'),
            initialValue: editingFabric?.name ?? '',
            autoFocus: true,
          },
          {
            key: 'category',
            placeholder: t('fabrics.categoryPlaceholder'),
            initialValue: editingFabric?.category ?? '',
          },
        ]}
        submitLabel={t('common.save')}
        extraAction={
          editingFabric
            ? {
                label: t('fabrics.recalibrate'),
                variant: 'secondary',
                onPress: () => {
                  const target = editingFabric;
                  setEditingFabric(null);
                  setRecalibrateTarget(target);
                },
              }
            : undefined
        }
        onSubmit={(values) => {
          if (!editingFabric) return;
          const name = (values.name ?? '').trim() || t('common.untitledFabric');
          const category = (values.category ?? '').trim();
          const target = editingFabric;
          void (async () => {
            try {
              await updateFabricMeta({ id: target.id, name, category });
            } catch (error) {
              logger.error('fabrics', 'failed to update fabric', error, {
                fabricId: target.id,
              });
              showToast({ message: t('fabrics.updateFailed'), variant: 'error' });
            } finally {
              setEditingFabric(null);
              // 未キャリブレーションの布地のみ自動でキャリブレーション画面を開く
              if (target.pxPerMm == null) {
                setRecalibrateTarget(target);
              }
            }
          })();
        }}
        onCancel={() => setEditingFabric(null)}
      />
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
          register.confirmMeta(values.name ?? '', values.category ?? '');
        }}
        onCancel={register.cancel}
      />

      {/* 新規登録のキャリブレーション */}
      {register.pendingCalibration && (
        <CalibrationScreen
          visible={true}
          imageUri={register.pendingCalibration.uri}
          onConfirm={(pxPerMm) => {
            void register.confirmCalibration(pxPerMm);
          }}
          onCancel={register.cancel}
        />
      )}

      {/* 既存布地の再キャリブレーション */}
      {recalibrateTarget && (
        <CalibrationScreen
          visible={true}
          imageUri={recalibrateTarget.imagePath}
          onConfirm={(pxPerMm) => {
            const target = recalibrateTarget;
            setRecalibrateTarget(null);
            void (async () => {
              try {
                await updateFabricMeta({
                  id: target.id,
                  name: target.name,
                  category: target.category,
                  pxPerMm,
                });
                showToast({ message: t('fabrics.calibrationSaved'), variant: 'success' });
              } catch (error) {
                logger.error('fabrics', 'failed to save calibration', error, {
                  fabricId: target.id,
                });
                showToast({ message: t('fabrics.updateFailed'), variant: 'error' });
              }
            })();
          }}
          onCancel={() => setRecalibrateTarget(null)}
        />
      )}
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
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});
