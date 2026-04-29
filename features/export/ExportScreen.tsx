import { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useRouter } from 'expo-router';

import * as MediaLibrary from 'expo-media-library';

import { useAtomValue, useSetAtom } from 'jotai';

import { fabricsAtom, loadFabricsAtom } from '@/atoms/fabrics';
import { showDialogAtom, showToastAtom } from '@/atoms/notification';
import { Button } from '@/components/ui/Button';
import { findDesignById, loadDesigns } from '@/constants/designs';
import { WorkCanvas } from '@/features/export/WorkCanvas';
import type { Design } from '@/types/design';
import type { Work } from '@/types/work';
import { findWorkById } from '@/utils/db';

const HORIZONTAL_PADDING = 24;
const EXPORT_RESOLUTION = 1080;

export const ExportScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fabrics = useAtomValue(fabricsAtom);
  const loadFabrics = useSetAtom(loadFabricsAtom);
  const showDialog = useSetAtom(showDialogAtom);
  const showToast = useSetAtom(showToastAtom);

  const [work, setWork] = useState<Work | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const offscreenRef = useRef<View>(null);

  useEffect(() => {
    let cancelled = false;
    void loadFabrics();
    void (async () => {
      try {
        const loaded = await findWorkById(id);
        if (cancelled) return;
        if (!loaded) {
          throw new Error('not found');
        }
        const designs = loadDesigns();
        const target = findDesignById(designs, loaded.designId);
        if (!target) {
          throw new Error('design not found');
        }
        setWork(loaded);
        setDesign(target);
      } catch {
        if (cancelled) return;
        showDialog({
          title: t('common.confirm'),
          message: t('exportScreen.notFound'),
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
  }, [id, loadFabrics, router, showDialog, t]);

  const screenWidth = Dimensions.get('window').width;
  const previewSize = Math.min(screenWidth - HORIZONTAL_PADDING * 2, 360);

  const handleExportImage = async () => {
    if (isExporting || !offscreenRef.current) return;
    setIsExporting(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast({ message: t('exportScreen.permissionDeniedLibrary'), variant: 'error' });
        return;
      }
      const uri = await captureRef(offscreenRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: EXPORT_RESOLUTION,
        height: EXPORT_RESOLUTION,
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast({ message: t('exportScreen.saved'), variant: 'success' });
    } catch {
      showToast({
        message: t('error.exportImageFailed'),
        variant: 'error',
        actionLabel: t('common.retry'),
        onAction: () => {
          void handleExportImage();
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!work || !design) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{work.name}</Text>
        <View style={styles.previewWrap}>
          <WorkCanvas
            design={design}
            pieceSettings={work.pieceSettings}
            fabrics={fabrics}
            size={previewSize}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('exportScreen.image')}</Text>
          <Text style={styles.sectionDescription}>{t('exportScreen.imageDescription')}</Text>
          <Button
            label={t('exportScreen.image')}
            disabled={isExporting}
            onPress={() => {
              void handleExportImage();
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('exportScreen.pdf')}</Text>
          <Text style={styles.sectionDescription}>{t('exportScreen.pdfDescription')}</Text>
          <Button label={t('exportScreen.pdf')} variant="secondary" onPress={() => undefined} disabled />
        </View>
      </ScrollView>

      {/* オフスクリーン高解像度キャンバス（画面外に配置してキャプチャ対象とする） */}
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={offscreenRef} collapsable={false}>
          <WorkCanvas
            design={design}
            pieceSettings={work.pieceSettings}
            fabrics={fabrics}
            size={EXPORT_RESOLUTION}
            showBorders={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 20,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  previewWrap: {
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  offscreen: {
    position: 'absolute',
    left: -100000,
    top: -100000,
    width: EXPORT_RESOLUTION,
    height: EXPORT_RESOLUTION,
    opacity: 0,
  },
});
