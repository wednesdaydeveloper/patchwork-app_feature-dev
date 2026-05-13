import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

import { PRESET_FABRICS } from '@/constants/presetFabrics';
import type { FabricImage } from '@/types/fabric';
import { findFabricById, insertFabric } from '@/utils/db';
import { logger } from '@/utils/logger';

const SEED_FLAG_KEY = 'preset_fabrics_seeded_v1';
const FABRICS_SUBDIR = 'fabrics';

/**
 * アプリ初回起動時にプリセット布地を DB へ登録する。
 * AsyncStorage フラグで二重実行を防ぐ。
 */
export async function seedInitialFabricsIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEED_FLAG_KEY);
  if (seeded === 'true') return;

  const dir = new Directory(Paths.document, FABRICS_SUBDIR);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }

  for (const preset of PRESET_FABRICS) {
    try {
      const existing = await findFabricById(preset.id);
      if (existing) continue;

      const asset = await Asset.fromModule(preset.asset).downloadAsync();
      if (!asset.localUri) {
        logger.warn('seed', `プリセット布地のアセット URI が取得できませんでした: ${preset.id}`);
        continue;
      }

      const dest = new File(Paths.document, FABRICS_SUBDIR, `${preset.id}.png`);
      if (dest.exists) dest.delete();
      const source = new File(asset.localUri);
      source.copy(dest);

      const fabric: FabricImage = {
        id: preset.id,
        name: preset.name,
        category: preset.category,
        imagePath: dest.uri,
        pxPerMm: preset.pxPerMm,
        isPreset: true,
        createdAt: new Date(),
      };
      await insertFabric(fabric);
    } catch (e) {
      logger.error('seed', `プリセット布地の登録に失敗しました: ${preset.id}`, e);
    }
  }

  await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
}
