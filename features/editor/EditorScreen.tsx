import { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  adjustModeAtom,
  pieceSettingsAtom,
  resetEditorAtom,
  selectedDesignAtom,
  selectedPolygonIdAtom,
  upsertPieceSettingAtom,
} from '@/atoms/editor';
import { fabricsAtom, loadFabricsAtom } from '@/atoms/fabrics';
import { findDesignById, loadDesigns } from '@/constants/designs';
import { FabricPicker } from '@/components/fabric/FabricPicker';
import { Button } from '@/components/ui/Button';
import { AdjustOverlay } from '@/features/editor/AdjustOverlay';
import { EditorCanvas } from '@/features/editor/EditorCanvas';
import type { FabricImage } from '@/types/fabric';

const HORIZONTAL_PADDING = 24;

export const EditorScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; designId?: string }>();
  const setDesign = useSetAtom(selectedDesignAtom);
  const resetEditor = useSetAtom(resetEditorAtom);
  const upsertPieceSetting = useSetAtom(upsertPieceSettingAtom);
  const loadFabrics = useSetAtom(loadFabricsAtom);
  const design = useAtomValue(selectedDesignAtom);
  const selectedPolygonId = useAtomValue(selectedPolygonIdAtom);
  const pieceSettings = useAtomValue(pieceSettingsAtom);
  const fabrics = useAtomValue(fabricsAtom);
  const adjustMode = useAtomValue(adjustModeAtom);
  const setAdjustMode = useSetAtom(adjustModeAtom);

  useEffect(() => {
    resetEditor();
    if (params.id === 'new' && params.designId) {
      const designs = loadDesigns();
      const target = findDesignById(designs, params.designId);
      if (target) {
        setDesign(target);
      }
    }
    void loadFabrics();
    // 既存 Work の読み込み（id が UUID）は #36 で実装する
  }, [params.id, params.designId, resetEditor, setDesign, loadFabrics]);

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

  const handleSelectFabric = useCallback(
    (fabric: FabricImage) => {
      if (!selectedPolygonId) return;
      const existing = pieceSettings.find((s) => s.polygonId === selectedPolygonId);
      upsertPieceSetting({
        polygonId: selectedPolygonId,
        fabricImageId: fabric.id,
        offsetX: existing?.offsetX ?? 0,
        offsetY: existing?.offsetY ?? 0,
        scale: existing?.scale ?? 1,
      });
    },
    [pieceSettings, selectedPolygonId, upsertPieceSetting],
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
});
