import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import { showToastAtom } from '@/atoms/notification';
import { loadWorksAtom, worksAtom, worksLoadedAtom } from '@/atoms/works';
import { Button } from '@/components/ui/Button';
import { LoadingView } from '@/components/ui/LoadingView';
import { WorkListItem } from '@/features/home/WorkListItem';
import type { Work } from '@/types/work';
import { logger } from '@/utils/logger';

export const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const works = useAtomValue(worksAtom);
  const loaded = useAtomValue(worksLoadedAtom);
  const loadWorks = useSetAtom(loadWorksAtom);
  const showToast = useSetAtom(showToastAtom);

  useEffect(() => {
    loadWorks().catch((error) => {
      logger.error('home', 'failed to load works', error);
      showToast({ message: t('error.workLoadFailed'), variant: 'error' });
    });
  }, [loadWorks, showToast, t]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>

      <View style={styles.actions}>
        <Button
          label={t('home.newWork')}
          onPress={() => router.push('/design-select')}
        />
        <Button
          label={t('home.fabrics')}
          variant="secondary"
          onPress={() => router.push('/fabrics')}
        />
        <Button
          label={t('home.settings')}
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('home.savedWorks')}</Text>

      {!loaded ? (
        <LoadingView label={t('common.loading')} />
      ) : works.length === 0 ? (
        <EmptyState
          message={t('home.empty')}
          ctaLabel={t('home.newWork')}
          onCta={() => router.push('/design-select')}
        />
      ) : (
        <FlatList
          data={works}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const keyExtractor = (item: Work) => item.id;

const renderItem = ({ item }: { item: Work }) => <WorkListItem work={item} />;

interface EmptyStateProps {
  message: string;
  ctaLabel: string;
  onCta: () => void;
}

const EmptyState = ({ message, ctaLabel, onCta }: EmptyStateProps) => {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyMessage}>{message}</Text>
      <Button label={ctaLabel} onPress={onCta} />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  actions: {
    gap: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
