import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ImagePicker from 'expo-image-picker';

import { useSetAtom } from 'jotai';

import { showToastAtom } from '@/atoms/notification';
import { addFabricAtom } from '@/atoms/fabrics';
import type { FabricImage } from '@/types/fabric';
import { saveFabricImage } from '@/utils/fileSystem';
import { logger } from '@/utils/logger';

import {
  FABRIC_MULTI_PICK_LIMIT,
  bulkFabricName,
  generateFabricId,
  resolveFabricMeta,
} from './fabricRegisterHelpers';

export type RegisterSource = 'camera' | 'library';

interface PendingPick {
  uri: string;
}

interface PendingCalibration {
  uri: string;
  name: string;
  category: string;
}

interface PendingBulk {
  uris: string[];
}

interface UseFabricRegisterResult {
  /** 名前/カテゴリ入力待ち */
  pending: PendingPick | null;
  /** キャリブレーション待ち */
  pendingCalibration: PendingCalibration | null;
  /** 一括登録: プレフィックス/カテゴリ入力待ち */
  pendingBulk: PendingBulk | null;
  pick: (source: RegisterSource) => Promise<void>;
  /** カメラロールから複数枚を選択して一括登録フローを開始 */
  pickMultiple: () => Promise<void>;
  /** 名前/カテゴリを確定し、キャリブレーション段階へ進める */
  confirmMeta: (name: string, category: string) => void;
  /** キャリブレーション結果(pxPerMm)を確定し、DB 登録 */
  confirmCalibration: (pxPerMm: number) => Promise<void>;
  /** 一括登録の確定: pxPerMm = null で全件 DB 登録 */
  confirmBulk: (prefix: string, category: string) => Promise<void>;
  cancel: () => void;
}


/**
 * 布地登録フローを管理するフック。
 *
 * 1. `pick(source)` でカメラ／カメラロールから画像を選択
 * 2. 成功すると `pending` に URI を保持し、UI 側で名前・カテゴリ入力を表示
 * 3. `confirm(name, category)` でファイル保存 + DB 登録
 * 4. `cancel()` で破棄
 *
 * `pickMultiple` はカメラロールから複数枚を取り込み、`pendingBulk` 経由で
 * プレフィックス/カテゴリを 1 度入力させて pxPerMm = null で一括登録する。
 */
export function useFabricRegister(): UseFabricRegisterResult {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingPick | null>(null);
  const [pendingCalibration, setPendingCalibration] = useState<PendingCalibration | null>(null);
  const [pendingBulk, setPendingBulk] = useState<PendingBulk | null>(null);
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

  const pickMultiple = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast({ message: t('error.permissionLibrary'), variant: 'error' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: FABRIC_MULTI_PICK_LIMIT,
      });
      if (result.canceled || result.assets.length === 0) {
        return;
      }
      let uris = result.assets.map((a) => a.uri);
      if (uris.length > FABRIC_MULTI_PICK_LIMIT) {
        showToast({
          message: t('fabrics.bulkLimitWarning', { limit: FABRIC_MULTI_PICK_LIMIT }),
          variant: 'info',
        });
        uris = uris.slice(0, FABRIC_MULTI_PICK_LIMIT);
      }
      setPendingBulk({ uris });
    } catch (error) {
      logger.error('fabrics', 'failed to pick multiple images', error);
      showToast({ message: t('fabrics.registerFailed'), variant: 'error' });
    }
  }, [showToast, t]);

  const confirmMeta = useCallback(
    (name: string, category: string) => {
      if (!pending) return;
      const meta = resolveFabricMeta(name, category);
      setPendingCalibration({
        uri: pending.uri,
        name: meta.name,
        category: meta.category,
      });
      setPending(null);
    },
    [pending],
  );

  const confirmCalibration = useCallback(
    async (pxPerMm: number) => {
      if (!pendingCalibration) return;
      try {
        const id = generateFabricId();
        const localUri = saveFabricImage(pendingCalibration.uri, id);
        const fabric: FabricImage = {
          id,
          name: pendingCalibration.name,
          category: pendingCalibration.category,
          imagePath: localUri,
          pxPerMm,
          isPreset: false,
          createdAt: new Date(),
        };
        await addFabric(fabric);
        setPendingCalibration(null);
        showToast({ message: t('fabrics.registerSuccess'), variant: 'success' });
      } catch (error) {
        setPendingCalibration(null);
        logger.error('fabrics', 'failed to register fabric', error);
        showToast({ message: t('fabrics.registerFailed'), variant: 'error' });
      }
    },
    [pendingCalibration, addFabric, showToast, t],
  );

  const confirmBulk = useCallback(
    async (prefix: string, category: string) => {
      if (!pendingBulk) return;
      const { uris } = pendingBulk;
      const trimmedCategory = category.trim();
      try {
        for (let i = 0; i < uris.length; i += 1) {
          const id = generateFabricId();
          const localUri = saveFabricImage(uris[i], id);
          const fabric: FabricImage = {
            id,
            name: bulkFabricName(prefix, i + 1, uris.length),
            category: trimmedCategory,
            imagePath: localUri,
            pxPerMm: null,
            isPreset: false,
            createdAt: new Date(),
          };
          await addFabric(fabric);
        }
        setPendingBulk(null);
        showToast({
          message: t('fabrics.bulkRegisterSuccess', { count: uris.length }),
          variant: 'success',
        });
      } catch (error) {
        setPendingBulk(null);
        logger.error('fabrics', 'failed to bulk register fabrics', error);
        showToast({ message: t('fabrics.bulkRegisterFailed'), variant: 'error' });
      }
    },
    [pendingBulk, addFabric, showToast, t],
  );

  const cancel = useCallback(() => {
    setPending(null);
    setPendingCalibration(null);
    setPendingBulk(null);
  }, []);

  return {
    pending,
    pendingCalibration,
    pendingBulk,
    pick,
    pickMultiple,
    confirmMeta,
    confirmCalibration,
    confirmBulk,
    cancel,
  };
}
