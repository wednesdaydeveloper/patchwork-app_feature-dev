import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import { fabricsAtom, loadFabricsAtom } from '@/atoms/fabrics';
import { showDialogAtom } from '@/atoms/notification';
import { Button } from '@/components/ui/Button';
import { findDesignById, loadDesigns } from '@/constants/designs';
import { WorkCanvas } from '@/features/export/WorkCanvas';
import type { Design } from '@/types/design';
import type { Work } from '@/types/work';
import { findWorkById } from '@/utils/db';

const HORIZONTAL_PADDING = 24;

export const ExportScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fabrics = useAtomValue(fabricsAtom);
  const loadFabrics = useSetAtom(loadFabricsAtom);
  const showDialog = useSetAtom(showDialogAtom);

  const [work, setWork] = useState<Work | null>(null);
  const [design, setDesign] = useState<Design | null>(null);

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

  if (!work || !design) {
    return <View style={styles.placeholder} />;
  }

  return (
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
        <Button label={t('exportScreen.image')} onPress={() => undefined} disabled />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('exportScreen.pdf')}</Text>
        <Text style={styles.sectionDescription}>{t('exportScreen.pdfDescription')}</Text>
        <Button label={t('exportScreen.pdf')} variant="secondary" onPress={() => undefined} disabled />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    backgroundColor: '#f9fafb',
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
});
