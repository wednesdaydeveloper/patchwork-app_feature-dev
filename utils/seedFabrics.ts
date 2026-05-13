import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

import { PRESET_FABRICS, PRESET_FABRICS_VERSION } from '@/constants/presetFabrics';
import { findFabricById, insertFabric, updateFabric } from '@/utils/db';
import { logger } from '@/utils/logger';

const VERSION_KEY = 'preset_fabrics_version';
const FABRICS_SUBDIR = 'fabrics';

/**
 * プリセット布地を DB へ登録・更新する。
 *
 * AsyncStorage に保存したバージョンと `PRESET_FABRICS_VERSION` が一致する場合は何もしない。
 * 不一致（初回起動 or 定義更新後）の場合は全プリセットを再適用する：
 * - 画像ファイルを上書きコピー
 * - DB レコードが存在すれば名前・カテゴリ・pxPerMm を更新、なければ新規挿入
 */
export async function seedInitialFabricsIfNeeded(): Promise<void> {
  const storedVersion = await AsyncStorage.getItem(VERSION_KEY);
  if (storedVersion === PRESET_FABRICS_VERSION) return;

  const dir = new Directory(Paths.document, FABRICS_SUBDIR);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }

  let imageCopyAllSucceeded = true;

  for (const preset of PRESET_FABRICS) {
    // --- 画像コピー（失敗しても DB 更新は続行） ---
    const dest = new File(Paths.document, FABRICS_SUBDIR, `${preset.id}.png`);
    let imageCopied = false;
    try {
      const asset = await Asset.fromModule(preset.asset).downloadAsync();
      if (!asset.localUri) {
        logger.warn('seed', `プリセット布地のアセット URI が取得できませんでした: ${preset.id}`);
        imageCopyAllSucceeded = false;
      } else {
        if (dest.exists) dest.delete();
        new File(asset.localUri).copy(dest);
        imageCopied = true;
      }
    } catch (e) {
      imageCopyAllSucceeded = false;
      logger.warn('seed', `プリセット布地の画像コピーに失敗しました: ${preset.id}`, undefined, e);
    }

    // --- DB 更新（画像コピーの成否に関わらず実施） ---
    try {
      const existing = await findFabricById(preset.id);
      if (existing) {
        await updateFabric({
          ...existing,
          name: preset.name,
          category: preset.category,
          pxPerMm: preset.pxPerMm,
        });
      } else if (imageCopied) {
        await insertFabric({
          id: preset.id,
          name: preset.name,
          category: preset.category,
          imagePath: dest.uri,
          pxPerMm: preset.pxPerMm,
          isPreset: true,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      imageCopyAllSucceeded = false;
      logger.error('seed', `プリセット布地の DB 更新に失敗しました: ${preset.id}`, e);
    }
  }

  // 画像コピーが全て成功した場合のみバージョンを記録する。
  // 失敗した場合は次回起動時に画像コピーを再試行しつつ、DB 更新は済んでいるので pxPerMm は反映済み。
  if (imageCopyAllSucceeded) {
    await AsyncStorage.setItem(VERSION_KEY, PRESET_FABRICS_VERSION);
  }
}
