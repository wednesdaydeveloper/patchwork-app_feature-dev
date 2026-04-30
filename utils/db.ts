import * as SQLite from 'expo-sqlite';

import type { FabricImage } from '@/types/fabric';
import type { PieceSetting, Work } from '@/types/work';

const DB_NAME = 'patchwork.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * DB を遅延初期化で取得する。
 * テーブル作成・マイグレーションは初回呼び出し時のみ実行。
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = result?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS fabric_images (
        id           TEXT PRIMARY KEY NOT NULL,
        name         TEXT NOT NULL,
        category     TEXT NOT NULL DEFAULT '',
        image_path   TEXT NOT NULL,
        created_at   INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS works (
        id           TEXT PRIMARY KEY NOT NULL,
        name         TEXT NOT NULL,
        design_id    TEXT NOT NULL,
        created_at   INTEGER NOT NULL,
        updated_at   INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS piece_settings (
        work_id          TEXT NOT NULL,
        polygon_id       TEXT NOT NULL,
        fabric_image_id  TEXT NOT NULL,
        offset_x         REAL NOT NULL,
        offset_y         REAL NOT NULL,
        scale            REAL NOT NULL,
        PRIMARY KEY (work_id, polygon_id),
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
        FOREIGN KEY (fabric_image_id) REFERENCES fabric_images(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_piece_settings_fabric
        ON piece_settings(fabric_image_id);

      CREATE INDEX IF NOT EXISTS idx_works_updated_at
        ON works(updated_at DESC);

      PRAGMA user_version = 1;
    `);
  }

  if (current < 2) {
    // Work にパッチワーク物理サイズ（mm）を追加。既存行は 150 にデフォルト。
    await db.execAsync(`
      ALTER TABLE works ADD COLUMN size_mm REAL NOT NULL DEFAULT 150;
      PRAGMA user_version = 2;
    `);
  }

  if (current < 3) {
    // FabricImage にキャリブレーション値（画像 1mm あたりの px 数）を追加。
    // 既存行は NULL（未キャリブレーション）として扱う。
    await db.execAsync(`
      ALTER TABLE fabric_images ADD COLUMN px_per_mm REAL;
      PRAGMA user_version = 3;
    `);
  }
}

// ----------------------------------------------------------------------------
// FabricImage CRUD
// ----------------------------------------------------------------------------

interface FabricImageRow {
  id: string;
  name: string;
  category: string;
  image_path: string;
  px_per_mm: number | null;
  created_at: number;
}

function rowToFabric(row: FabricImageRow): FabricImage {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    imagePath: row.image_path,
    pxPerMm: row.px_per_mm,
    createdAt: new Date(row.created_at),
  };
}

const FABRIC_NAME_FALLBACK = 'Fabric';

function normalizeFabricName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : FABRIC_NAME_FALLBACK;
}

export async function insertFabric(fabric: FabricImage): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO fabric_images (id, name, category, image_path, px_per_mm, created_at) VALUES (?, ?, ?, ?, ?, ?);',
    [
      fabric.id,
      normalizeFabricName(fabric.name),
      fabric.category,
      fabric.imagePath,
      fabric.pxPerMm,
      fabric.createdAt.getTime(),
    ],
  );
}

export async function updateFabric(fabric: FabricImage): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE fabric_images SET name = ?, category = ?, px_per_mm = ? WHERE id = ?;',
    [normalizeFabricName(fabric.name), fabric.category, fabric.pxPerMm, fabric.id],
  );
}

export async function listFabrics(): Promise<FabricImage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FabricImageRow>(
    'SELECT id, name, category, image_path, px_per_mm, created_at FROM fabric_images ORDER BY created_at DESC;',
  );
  return rows.map(rowToFabric);
}

export async function findFabricById(id: string): Promise<FabricImage | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<FabricImageRow>(
    'SELECT id, name, category, image_path, px_per_mm, created_at FROM fabric_images WHERE id = ?;',
    [id],
  );
  return row ? rowToFabric(row) : null;
}

export async function isFabricReferenced(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) AS cnt FROM piece_settings WHERE fabric_image_id = ?;',
    [id],
  );
  return (row?.cnt ?? 0) > 0;
}

/**
 * 布地を削除する。参照中の `piece_settings` 行も合わせて削除する（強制削除）。
 * 物理ファイル削除は呼び出し側の責務（DB トランザクション成功後に実施）。
 */
export async function deleteFabric(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM piece_settings WHERE fabric_image_id = ?;', [id]);
    await db.runAsync('DELETE FROM fabric_images WHERE id = ?;', [id]);
  });
}

// ----------------------------------------------------------------------------
// Work + PieceSetting CRUD
// ----------------------------------------------------------------------------

interface WorkRow {
  id: string;
  name: string;
  design_id: string;
  size_mm: number;
  created_at: number;
  updated_at: number;
}

interface PieceSettingRow {
  work_id: string;
  polygon_id: string;
  fabric_image_id: string;
  offset_x: number;
  offset_y: number;
  scale: number;
}

function rowToPieceSetting(row: PieceSettingRow): PieceSetting {
  return {
    polygonId: row.polygon_id,
    fabricImageId: row.fabric_image_id,
    offsetX: row.offset_x,
    offsetY: row.offset_y,
    scale: row.scale,
  };
}

async function loadPieceSettings(
  db: SQLite.SQLiteDatabase,
  workId: string,
): Promise<PieceSetting[]> {
  const rows = await db.getAllAsync<PieceSettingRow>(
    `SELECT work_id, polygon_id, fabric_image_id, offset_x, offset_y, scale
     FROM piece_settings WHERE work_id = ?;`,
    [workId],
  );
  return rows.map(rowToPieceSetting);
}

/**
 * Work と PieceSetting をトランザクション内で upsert する。
 * 失敗時はロールバックされ、未保存状態が維持される。
 */
export async function saveWork(work: Work): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO works (id, name, design_id, size_mm, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         design_id = excluded.design_id,
         size_mm = excluded.size_mm,
         updated_at = excluded.updated_at;`,
      [
        work.id,
        work.name,
        work.designId,
        work.sizeMm,
        work.createdAt.getTime(),
        work.updatedAt.getTime(),
      ],
    );
    await db.runAsync('DELETE FROM piece_settings WHERE work_id = ?;', [work.id]);
    for (const setting of work.pieceSettings) {
      await db.runAsync(
        `INSERT INTO piece_settings
           (work_id, polygon_id, fabric_image_id, offset_x, offset_y, scale)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          work.id,
          setting.polygonId,
          setting.fabricImageId,
          setting.offsetX,
          setting.offsetY,
          setting.scale,
        ],
      );
    }
  });
}

export async function findWorkById(id: string): Promise<Work | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WorkRow>(
    'SELECT id, name, design_id, size_mm, created_at, updated_at FROM works WHERE id = ?;',
    [id],
  );
  if (!row) return null;
  const pieceSettings = await loadPieceSettings(db, id);
  return {
    id: row.id,
    name: row.name,
    designId: row.design_id,
    sizeMm: row.size_mm,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    pieceSettings,
  };
}

export async function listWorks(): Promise<Work[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkRow>(
    'SELECT id, name, design_id, size_mm, created_at, updated_at FROM works ORDER BY updated_at DESC;',
  );
  const works: Work[] = [];
  for (const row of rows) {
    const pieceSettings = await loadPieceSettings(db, row.id);
    works.push({
      id: row.id,
      name: row.name,
      designId: row.design_id,
      sizeMm: row.size_mm,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      pieceSettings,
    });
  }
  return works;
}

export async function deleteWork(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM works WHERE id = ?;', [id]);
}

// ----------------------------------------------------------------------------
// テスト用: DB を閉じてキャッシュをリセット
// ----------------------------------------------------------------------------

export async function _resetDatabaseForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => {
    // すでに存在しない場合は無視
  });
}
