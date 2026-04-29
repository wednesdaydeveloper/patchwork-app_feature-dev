import { getAvailableDiskSpace } from '@/utils/fileSystem';

/** 警告閾値: これ未満になったら警告ダイアログを出す（50MB） */
export const STORAGE_LOW_THRESHOLD_BYTES = 50 * 1024 * 1024;

/** 拒否閾値: これ未満なら処理を中止（5MB） */
export const STORAGE_BLOCK_THRESHOLD_BYTES = 5 * 1024 * 1024;

export type StorageStatus = 'ok' | 'low' | 'full';

/**
 * 残容量を取得して警告区分を返す。
 *
 * - `ok` : 通常進行
 * - `low`: ユーザー確認の上で進行（要警告ダイアログ）
 * - `full`: 即時中断（要エラーダイアログ）
 */
export function checkStorageStatus(): { status: StorageStatus; availableBytes: number } {
  const availableBytes = getAvailableDiskSpace();
  if (availableBytes < STORAGE_BLOCK_THRESHOLD_BYTES) {
    return { status: 'full', availableBytes };
  }
  if (availableBytes < STORAGE_LOW_THRESHOLD_BYTES) {
    return { status: 'low', availableBytes };
  }
  return { status: 'ok', availableBytes };
}
