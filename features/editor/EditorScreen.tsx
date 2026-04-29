import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  adjustModeAtom,
  editingWorkIdAtom,
  editingWorkNameAtom,
  pieceSettingsAtom,
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
import { PromptDialog } from '@/components/ui/PromptDialog';
import { useStorageGuard } from '@/hooks/useStorageGuard';
import { AdjustOverlay } from '@/features/editor/AdjustOverlay';
import { EditorCanvas } from '@/features/editor/EditorCanvas';
import type { Work } from '@/types/work';
import type { FabricImage } from '@/types/fabric';

const HORIZONTAL_PADDING = 24;

function generateWorkId(): string {
  return `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const EditorScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; designId?: string }>();
  const setDesign = useSetAtom(selectedDesignAtom);
  const resetEditor = useSetAtom(resetEditorAtom);
  const upsertPieceSetting = useSetAtom(upsertPieceSettingAtom);
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
  const saveWork = useSetAtom(saveWorkAtom);
  const showToast = useSetAtom(showToastAtom);
  const [savePromptVisible, setSavePromptVisible] = useState(false);
  const editingWorkCreatedAt = useRef<Date | null>(null);
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
      return () => {
        cancelled = true;
      };
    }

    // 既存 Work の読み込み
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    params.id,
    params.designId,
    resetEditor,
    clearHistory,
    setDesign,
    setPieceSettings,
    setEditingWorkId,
    setEditingWorkName,
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
        createdAt: editingWorkId ? (editingWorkCreatedAt.current ?? now) : now,
        updatedAt: now,
        pieceSettings,
      };
      try {
        await saveWork(work);
        setEditingWorkId(work.id);
        setEditingWorkName(work.name);
        editingWorkCreatedAt.current = work.createdAt;
        clearHistory();
        showToast({ message: t('editor.saveSuccess'), variant: 'success' });
        setSavePromptVisible(false);
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
      pieceSettings,
      saveWork,
      setEditingWorkId,
      setEditingWorkName,
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
        </View>
        <Text style={styles.label}>{selectedLabel}</Text>
        <EditorCanvas design={design} size={canvasSize} />
        {selectedFabricId && !adjustMode && (
          <Button
            label={t('editor.adjust')}
            variant="secondary"
            onPress={() => setAdjustMode(true)}
          />
        )}
      </View>
      <AdjustOverlay size={canvasSize} />
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
        onCancel={() => setSavePromptVisible(false)}
      />
      <FabricPicker
        fabrics={fabrics}
        selectedFabricId={selectedFabricId}
        onSelect={handleSelectFabric}
        onAddFabric={() => router.push('/fabrics')}
      />
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
});
