import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

import { useSetAtom } from 'jotai';

import { showDialogAtom } from '@/atoms/notification';
import { checkStorageStatus } from '@/utils/storage';

/**
 * ストレージ容量を事前チェックするためのガードフック。
 *
 * - 残容量が `full` 閾値未満ならダイアログでブロック（ホーム画面で削除を促す）し `false` を返す
 * - `low` ならユーザーに続行可否を確認し、続行なら `true`、キャンセルなら `false`
 * - `ok` ならそのまま `true`
 */
export function useStorageGuard(): () => Promise<boolean> {
  const { t } = useTranslation();
  const showDialog = useSetAtom(showDialogAtom);
  const router = useRouter();

  return useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const { status } = checkStorageStatus();

      if (status === 'ok') {
        resolve(true);
        return;
      }

      if (status === 'full') {
        showDialog({
          title: t('error.storageFullTitle'),
          message: t('error.storageFull'),
          actions: [
            {
              label: t('home.title'),
              variant: 'primary',
              onPress: () => {
                router.replace('/');
                resolve(false);
              },
            },
            {
              label: t('common.cancel'),
              variant: 'secondary',
              onPress: () => resolve(false),
            },
          ],
        });
        return;
      }

      // low
      showDialog({
        title: t('error.storageFullTitle'),
        message: t('error.storageLow'),
        actions: [
          {
            label: t('common.ok'),
            variant: 'primary',
            onPress: () => resolve(true),
          },
          {
            label: t('common.cancel'),
            variant: 'secondary',
            onPress: () => resolve(false),
          },
        ],
      });
    });
  }, [router, showDialog, t]);
}
