import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ImagePicker from 'expo-image-picker';

import { useSetAtom } from 'jotai';

import { showToastAtom } from '@/atoms/notification';
import { addFabricAtom } from '@/atoms/fabrics';
import type { FabricImage } from '@/types/fabric';
import { saveFabricImage } from '@/utils/fileSystem';
import { logger } from '@/utils/logger';

export type RegisterSource = 'camera' | 'library';

interface PendingPick {
  uri: string;
}

interface UseFabricRegisterResult {
  pending: PendingPick | null;
  pick: (source: RegisterSource) => Promise<void>;
  confirm: (name: string, category: string) => Promise<void>;
  cancel: () => void;
}

function generateFabricId(): string {
  return `fab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultName(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * 布地登録フローを管理するフック。
 *
 * 1. `pick(source)` でカメラ／カメラロールから画像を選択
 * 2. 成功すると `pending` に URI を保持し、UI 側で名前・カテゴリ入力を表示
 * 3. `confirm(name, category)` でファイル保存 + DB 登録
 * 4. `cancel()` で破棄
 */
export function useFabricRegister(): UseFabricRegisterResult {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingPick | null>(null);
  const showToast = useSetAtom(showToastAtom);
  const addFabric = useSetAtom(addFabricAtom);

  const pick = useCallback(
    async (source: RegisterSource) => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showToast({
            message:
              source === 'camera'
                ? t('error.permissionCamera')
                : t('error.permissionLibrary'),
            variant: 'error',
          });
          return;
        }

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.9,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                quality: 0.9,
              });

        if (result.canceled || result.assets.length === 0) {
          return;
        }
        const asset = result.assets[0];
        setPending({ uri: asset.uri });
      } catch (error) {
        logger.error('fabrics', 'failed to pick image', error, { source });
        showToast({ message: t('fabrics.registerFailed'), variant: 'error' });
      }
    },
    [showToast, t],
  );

  const confirm = useCallback(
    async (name: string, category: string) => {
      if (!pending) {
        return;
      }
      try {
        const id = generateFabricId();
        const localUri = saveFabricImage(pending.uri, id);
        const fabric: FabricImage = {
          id,
          name: name.trim() || defaultName(),
          category: category.trim(),
          imagePath: localUri,
          createdAt: new Date(),
        };
        await addFabric(fabric);
        setPending(null);
        showToast({ message: t('fabrics.registerSuccess'), variant: 'success' });
      } catch (error) {
        setPending(null);
        logger.error('fabrics', 'failed to register fabric', error);
        showToast({ message: t('fabrics.registerFailed'), variant: 'error' });
      }
    },
    [pending, addFabric, showToast, t],
  );

  const cancel = useCallback(() => {
    setPending(null);
  }, []);

  return { pending, pick, confirm, cancel };
}
