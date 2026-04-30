import { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

import { useAtomValue, useSetAtom } from 'jotai';

import { showDialogAtom, showToastAtom } from '@/atoms/notification';
import { languagePreferenceAtom } from '@/atoms/settings';
import { removeWorkAtom } from '@/atoms/works';
import type { Work } from '@/types/work';
import { logger } from '@/utils/logger';
import { resolveLanguage } from '@/utils/i18n';
import { formatDate } from '@/utils/format';

export interface WorkListItemProps {
  work: Work;
}

const WorkListItemImpl = ({ work }: WorkListItemProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const preference = useAtomValue(languagePreferenceAtom);
  const showDialog = useSetAtom(showDialogAtom);
  const showToast = useSetAtom(showToastAtom);
  const removeWork = useSetAtom(removeWorkAtom);

  const language = resolveLanguage(preference);
  const displayName = work.name.trim() || t('common.untitled');
  const updatedLabel = `${t('home.updatedAt')}: ${formatDate(work.updatedAt, language)}`;

  const swipeableRef = useRef<Swipeable>(null);

  const handlePress = () => {
    router.push(`/editor/${work.id}`);
  };

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    showDialog({
      title: t('home.deleteConfirmTitle'),
      message: t('home.deleteConfirm'),
      actions: [
        {
          label: t('common.delete'),
          variant: 'danger',
          onPress: async () => {
            try {
              await removeWork(work.id);
            } catch (error) {
              logger.error('home', 'failed to delete work', error, { workId: work.id });
              showToast({ message: t('home.deleteFailed'), variant: 'error' });
            }
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
  }, [removeWork, showDialog, showToast, t, work.id]);

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.delete')}
      onPress={handleDelete}
      style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
    >
      <Text style={styles.deleteActionLabel}>{t('common.delete')}</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={displayName}
        onPress={handlePress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        <View style={styles.thumbnail} />
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.meta}>{updatedLabel}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
};

export const WorkListItem = memo(WorkListItemImpl);
WorkListItem.displayName = 'WorkListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  deleteAction: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
    borderRadius: 12,
  },
  deleteActionPressed: {
    opacity: 0.8,
  },
  deleteActionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
