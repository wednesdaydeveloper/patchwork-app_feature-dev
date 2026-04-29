import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  resetEditorAtom,
  selectedDesignAtom,
  selectedPolygonIdAtom,
} from '@/atoms/editor';
import { findDesignById, loadDesigns } from '@/constants/designs';
import { EditorCanvas } from '@/features/editor/EditorCanvas';

const HORIZONTAL_PADDING = 32;

export const EditorScreen = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; designId?: string }>();
  const setDesign = useSetAtom(selectedDesignAtom);
  const resetEditor = useSetAtom(resetEditorAtom);
  const design = useAtomValue(selectedDesignAtom);
  const selectedPolygonId = useAtomValue(selectedPolygonIdAtom);

  useEffect(() => {
    resetEditor();
    if (params.id === 'new' && params.designId) {
      const designs = loadDesigns();
      const target = findDesignById(designs, params.designId);
      if (target) {
        setDesign(target);
      }
    }
    // 既存 Work の読み込み（id が UUID）は #36 で実装する
  }, [params.id, params.designId, resetEditor, setDesign]);

  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - HORIZONTAL_PADDING * 2, 480);

  const selectedLabel = useMemo(() => {
    if (!design || !selectedPolygonId) {
      return t('editor.selectPiece');
    }
    const polygon = design.polygons.find((p) => p.id === selectedPolygonId);
    return polygon ? t(`piece.${polygon.label}`, { defaultValue: polygon.label }) : '';
  }, [design, selectedPolygonId, t]);

  if (!design) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholder}>{t('editor.placeholderCanvas')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{selectedLabel}</Text>
      <EditorCanvas design={design} size={canvasSize} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    backgroundColor: '#f9fafb',
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
