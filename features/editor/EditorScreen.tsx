import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import type { NavigationAction } from '@react-navigation/native';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  adjustModeAtom,
  editingWorkIdAtom,
  editingWorkNameAtom,
  editingWorkNameDirtyAtom,
  editingWorkSizeMmAtom,
  editingWorkSizeMmDirtyAtom,
  pieceSettingsAtom,
  removePieceSettingAtom,
  resetEditorAtom,
  selectedDesignAtom,
  selectedPolygonIdAtom,
  upsertPieceSettingAtom,
} from '@/atoms/editor';
import { fabricsAtom, loadFabricsAtom } from '@/atoms/fabrics';
import { canRedoAtom, canUndoAtom, clearHistoryAtom, pushHistoryAtom, redoAtom, undoAtom } from '@/atoms/history';
import { showDialogAtom, showToastAtom } from '@/atoms/notification';
import { saveWorkAtom } from '@/atoms/works';
import { findDesignById, loadDesigns } from '@/constants/designs';
import { findWorkById } from '@/utils/db';
import { logger } from '@/utils/logger';
import { FabricPicker } from '@/components/fabric/FabricPicker';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingView } from '@/components/ui/LoadingView';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { useStorageGuard } from '@/hooks/useStorageGuard';
import { AdjustOverlay } from '@/features/editor/AdjustOverlay';
import { EditorCanvas } from '@/features/editor/EditorCanvas';
import {
  WORK_SIZE_MM_DEFAULT,
  WORK_SIZE_MM_MAX,
  WORK_SIZE_MM_MIN,
  type Work,
} from '@/types/work';
import type { FabricImage } from '@/types/fabric';

const HORIZONTAL_PADDING = 24;

function generateWorkId(): string {
  return `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const EditorScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string; designId?: string; sizeMm?: string }>();
  const setDesign = useSetAtom(selectedDesignAtom);
  const resetEditor = useSetAtom(resetEditorAtom);
  const upsertPieceSetting = useSetAtom(upsertPieceSettingAtom);
  const removePieceSetting = useSetAtom(removePieceSettingAtom);
  const setPieceSettings = useSetAtom(pieceSettingsAtom);
  const showDialog = useSetAtom(showDialogAtom);
  const loadFabrics = useSetAtom(loadFabricsAtom);
  const design = useAtomValue(selectedDesignAtom);
  const selectedPolygonId = useAtomValue(selectedPolygonIdAtom);
  const pieceSettings = useAtomValue(pieceSettingsAtom);
  const fabrics = useAtomValue(fabricsAtom);
  const adjustMode = useAtomValue(adjustModeAtom);
  const setAdjustMode = useSetAtom(adjustModeAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const pushHistory = useSetAtom(pushHistoryAtom);
  const clearHistory = useSetAtom(clearHistoryAtom);
  const editingWorkId = useAtomValue(editingWorkIdAtom);
  const setEditingWorkId = useSetAtom(editingWorkIdAtom);
  const editingWorkName = useAtomValue(editingWorkNameAtom);
  const setEditingWorkName = useSetAtom(editingWorkNameAtom);
  const nameDirty = useAtomValue(editingWorkNameDirtyAtom);
  const setNameDirty = useSetAtom(editingWorkNameDirtyAtom);
  const editingWorkSizeMm = useAtomValue(editingWorkSizeMmAtom);
  const setEditingWorkSizeMm = useSetAtom(editingWorkSizeMmAtom);
  const sizeMmDirty = useAtomValue(editingWorkSizeMmDirtyAtom);
  const setSizeMmDirty = useSetAtom(editingWorkSizeMmDirtyAtom);
  const saveWork = useSetAtom(saveWorkAtom);
  const showToast = useSetAtom(showToastAtom);
  const [savePromptVisible, setSavePromptVisible] = useState(false);
  const [renamePromptVisible, setRenamePromptVisible] = useState(false);
  const [sizePromptVisible, setSizePromptVisible] = useState(false);
  const [isLoadingWork, setIsLoadingWork] = useState(false);
  const editingWorkCreatedAt = useRef<Date | null>(null);
  const pendingLeaveActionRef = useRef<NavigationAction | null>(null);
  const checkStorage = useStorageGuard();

  useEffect(() => {
    let cancelled = false;
    resetEditor();
    clearHistory();
    editingWorkCreatedAt.current = null;
    void loadFabrics();

    if (params.id === 'new') {
      if (params.designId) {
        const designs = loadDesigns();
        const target = findDesignById(designs, params.designId);
        if (target) {
          setDesign(target);
        }
      }
      // URL パラメータから sizeMm を取得（範囲外/不正値は default にフォールバック）
      const parsedSize = params.sizeMm ? Number(params.sizeMm) : NaN;
      const validSize =
        Number.isFinite(parsedSize) &&
        parsedSize >= WORK_SIZE_MM_MIN &&
        parsedSize <= WORK_SIZE_MM_MAX
          ? parsedSize
          : WORK_SIZE_MM_DEFAULT;
      setEditingWorkSizeMm(validSize);
      return () => {
        cancelled = true;
      };
    }

    // 既存 Work の読み込み
    setIsLoadingWork(true);
    void (async () => {
      try {
        const work = await findWorkById(params.id);
        if (cancelled) return;
        if (!work) {
          throw new Error('work not found');
        }
        const designs = loadDesigns();
        const target = findDesignById(designs, work.designId);
        if (!target) {
          throw new Error('design not found');
        }
        setDesign(target);
        setPieceSettings(work.pieceSettings);
        setEditingWorkId(work.id);
        setEditingWorkName(work.name);
        setEditingWorkSizeMm(work.sizeMm);
        editingWorkCreatedAt.current = work.createdAt;
      } catch (error) {
        if (cancelled) return;
        logger.error('editor', 'failed to load work', error, { id: params.id });
        showDialog({
          title: t('common.confirm'),
          message: t('error.workLoadFailed'),
          actions: [
            {
              label: t('common.back'),
              onPress: () => router.replace('/'),
            },
          ],
        });
      } finally {
        if (!cancelled) setIsLoadingWork(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    params.id,
    params.designId,
    params.sizeMm,
    resetEditor,
    clearHistory,
    setDesign,
    setPieceSettings,
    setEditingWorkId,
    setEditingWorkName,
    setEditingWorkSizeMm,
    showDialog,
    router,
    loadFabrics,
    t,
  ]);

  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - HORIZONTAL_PADDING * 2, 480);

  const selectedLabel = useMemo(() => {
    if (!design || !selectedPolygonId) {
      return t('editor.selectPiece');
    }
    const polygon = design.polygons.find((p) => p.id === selectedPolygonId);
    return polygon ? t(`piece.${polygon.label}`, { defaultValue: polygon.label }) : '';
  }, [design, selectedPolygonId, t]);

  const selectedFabricId = useMemo(() => {
    if (!selectedPolygonId) return null;
    return pieceSettings.find((s) => s.polygonId === selectedPolygonId)?.fabricImageId ?? null;
  }, [pieceSettings, selectedPolygonId]);

  const handleSave = useCallback(
    async (name: string) => {
      if (!design) return;
      const ok = await checkStorage();
      if (!ok) {
        setSavePromptVisible(false);
        return;
      }
      const trimmedName = name.trim() || t('common.untitled');
      const now = new Date();
      const work: Work = {
        id: editingWorkId ?? generateWorkId(),
        name: trimmedName,
        designId: design.id,
        sizeMm: editingWorkSizeMm,
        createdAt: editingWorkId ? (editingWorkCreatedAt.current ?? now) : now,
        updatedAt: now,
        pieceSettings,
      };
      try {
        await saveWork(work);
        setEditingWorkId(work.id);
        setEditingWorkName(work.name);
        setNameDirty(false);
        setSizeMmDirty(false);
        editingWorkCreatedAt.current = work.createdAt;
        clearHistory();
        showToast({ message: t('editor.saveSuccess'), variant: 'success' });
        setSavePromptVisible(false);
        // 保留中の離脱アクションがあれば実行
        const pending = pendingLeaveActionRef.current;
        if (pending) {
          pendingLeaveActionRef.current = null;
          (navigation as unknown as { dispatch: (a: NavigationAction) => void }).dispatch(pending);
        }
      } catch (error) {
        logger.error('editor', 'failed to save work', error, { workId: editingWorkId });
        showToast({
          message: t('error.workSaveFailed'),
          variant: 'error',
          actionLabel: t('common.retry'),
          onAction: () => setSavePromptVisible(true),
        });
        setSavePromptVisible(false);
      }
    },
    [
      checkStorage,
      clearHistory,
      design,
      editingWorkId,
      editingWorkSizeMm,
      navigation,
      pieceSettings,
      saveWork,
      setEditingWorkId,
      setEditingWorkName,
      setNameDirty,
      setSizeMmDirty,
      showToast,
      t,
    ],
  );

  const handleSelectFabric = useCallback(
    (fabric: FabricImage) => {
      if (!selectedPolygonId) return;
      const existing = pieceSettings.find((s) => s.polygonId === selectedPolygonId);
      pushHistory();
      upsertPieceSetting({
        polygonId: selectedPolygonId,
        fabricImageId: fabric.id,
        offsetX: existing?.offsetX ?? 0,
        offsetY: existing?.offsetY ?? 0,
        scale: existing?.scale ?? 1,
      });
    },
    [pieceSettings, pushHistory, selectedPolygonId, upsertPieceSetting],
  );

  // 未保存変更ガード: usePreventRemove で native-stack の swipe-back / header-back を抑止する。
  const hasUnsaved = canUndo || nameDirty || sizeMmDirty;
  usePreventRemove(hasUnsaved, ({ data }) => {
    showDialog({
      title: t('editor.unsavedTitle'),
      message: t('editor.unsavedMessage'),
      actions: [
        {
          label: t('editor.saveLeave'),
          variant: 'primary',
          onPress: () => {
            if (editingWorkId) {
              void (async () => {
                await handleSave(editingWorkName);
                (
                  navigation as unknown as {
                    dispatch: (a: NavigationAction) => void;
                  }
                ).dispatch(data.action);
              })();
            } else {
              // 新規(未命名): 保存ダイアログを開き、保存完了時に保留アクションを dispatch
              pendingLeaveActionRef.current = data.action;
              setSavePromptVisible(true);
            }
          },
        },
        {
          label: t('editor.discardLeave'),
          variant: 'danger',
          onPress: () => {
            clearHistory();
            setNameDirty(false);
            setSizeMmDirty(false);
            (
              navigation as unknown as {
                dispatch: (a: NavigationAction) => void;
              }
            ).dispatch(data.action);
          },
        },
        {
          label: t('common.cancel'),
          variant: 'secondary',
          onPress: () => {},
        },
      ],
    });
  });

  const handleUnassign = useCallback(() => {
    if (!selectedPolygonId) return;
    pushHistory();
    removePieceSetting(selectedPolygonId);
  }, [pushHistory, removePieceSetting, selectedPolygonId]);

  if (isLoadingWork) {
    return <LoadingView label={t('common.loading')} />;
  }

  if (!design) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholder}>{t('editor.placeholderCanvas')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasArea}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editor.renameWork')}
            onPress={() => setRenamePromptVisible(true)}
            style={styles.workNameRow}
          >
            <Text style={styles.workName}>
              {editingWorkName.trim() || t('common.untitled')}
            </Text>
            <Text style={styles.workNameHint}>✎</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editor.changeSize')}
            onPress={() => setSizePromptVisible(true)}
            style={styles.sizeChip}
          >
            <Text style={styles.sizeChipLabel}>{editingWorkSizeMm}mm</Text>
          </Pressable>
        </View>
        <View style={styles.toolbar}>
          <IconButton
            icon="↶"
            accessibilityLabel={t('editor.undo')}
            disabled={!canUndo}
            onPress={() => undo()}
          />
          <IconButton
            icon="↷"
            accessibilityLabel={t('editor.redo')}
            disabled={!canRedo}
            onPress={() => redo()}
          />
          <IconButton
            icon="💾"
            accessibilityLabel={t('editor.saveWork')}
            onPress={() => setSavePromptVisible(true)}
          />
          <IconButton
            icon="📤"
            accessibilityLabel={t('editor.exportAction')}
            disabled={!editingWorkId}
            onPress={() => {
              if (!editingWorkId) return;
              router.push(`/export/${editingWorkId}`);
            }}
          />
        </View>
        <Text style={styles.label}>{selectedLabel}</Text>
        <EditorCanvas design={design} size={canvasSize} />
        {selectedFabricId && !adjustMode && (
          <View style={styles.actionRow}>
            <Button
              label={t('editor.adjust')}
              variant="secondary"
              onPress={() => setAdjustMode(true)}
            />
            <Button
              label={t('editor.unassign')}
              variant="secondary"
              onPress={handleUnassign}
            />
          </View>
        )}
      </View>
      <AdjustOverlay size={canvasSize} />
      <PromptDialog
        visible={renamePromptVisible}
        title={t('editor.renameWork')}
        fields={[
          {
            key: 'name',
            placeholder: t('editor.workName'),
            initialValue: editingWorkName,
            autoFocus: true,
          },
        ]}
        submitLabel={t('common.save')}
        onSubmit={(values) => {
          const next = (values.name ?? '').trim();
          const resolved = next || t('common.untitled');
          if (resolved !== editingWorkName) {
            setEditingWorkName(resolved);
            setNameDirty(true);
          }
          setRenamePromptVisible(false);
        }}
        onCancel={() => setRenamePromptVisible(false)}
      />
      <PromptDialog
        visible={sizePromptVisible}
        title={t('editor.changeSize')}
        fields={[
          {
            key: 'sizeMm',
            placeholder: t('newWorkSize.label'),
            initialValue: String(editingWorkSizeMm),
            autoFocus: true,
            keyboardType: 'number-pad',
          },
        ]}
        submitLabel={t('common.save')}
        onSubmit={(values) => {
          const value = Number(values.sizeMm ?? '');
          if (
            !Number.isFinite(value) ||
            !Number.isInteger(value) ||
            value < WORK_SIZE_MM_MIN ||
            value > WORK_SIZE_MM_MAX
          ) {
            showToast({
              message: t('newWorkSize.invalidRange', {
                min: WORK_SIZE_MM_MIN,
                max: WORK_SIZE_MM_MAX,
              }),
              variant: 'error',
            });
            return;
          }
          if (value !== editingWorkSizeMm) {
            setEditingWorkSizeMm(value);
            setSizeMmDirty(true);
          }
          setSizePromptVisible(false);
        }}
        onCancel={() => setSizePromptVisible(false)}
      />
      <PromptDialog
        visible={savePromptVisible}
        title={t('editor.saveWork')}
        fields={[
          {
            key: 'name',
            placeholder: t('editor.workName'),
            initialValue: editingWorkName,
            autoFocus: true,
          },
        ]}
        submitLabel={t('common.save')}
        onSubmit={(values) => {
          void handleSave(values.name ?? '');
        }}
        onCancel={() => {
          pendingLeaveActionRef.current = null;
          setSavePromptVisible(false);
        }}
      />
      {!adjustMode && (
        <FabricPicker
          fabrics={fabrics}
          selectedFabricId={selectedFabricId}
          onSelect={handleSelectFabric}
          onAddFabric={() => router.push('/fabrics')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  canvasArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 16,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  workNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  sizeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
  },
  sizeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  workName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  workNameHint: {
    fontSize: 14,
    color: '#6b7280',
  },
});
