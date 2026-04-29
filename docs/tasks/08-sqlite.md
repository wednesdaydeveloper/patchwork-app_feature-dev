# #08 SQLite スキーマ・DB ユーティリティ

- **ステータス**: `[~]` 進行中（テストは #43 と統合）
- **フェーズ**: 2. 型定義・データ層
- **前提**: #02, #07

## 概要

`utils/db.ts` で `expo-sqlite` を初期化し、テーブル作成・CRUD ヘルパー・マイグレーションを実装する。

## 受け入れ条件 (AC)

- [x] テーブル: `fabric_images`, `works`, `piece_settings`
- [x] 初回起動時にテーブルが作成される
- [x] CRUD ヘルパー関数（insert / update / delete / select）が利用できる
- [x] マイグレーション関数を用意（バージョン管理）
- [x] 削除整合性ルールを実装（CLAUDE.md 1-3 に準拠）
  - `piece_settings.work_id` → `works.id` を `ON DELETE CASCADE`
  - `piece_settings.fabric_image_id` → `fabric_images.id` は `ON DELETE` なし。アプリ層で参照確認 → 強制削除時に対応 `piece_settings` 行を一括削除
- [x] 布地ファイルの物理削除は DB トランザクション成功後に実施
- [ ] 単体テストで CRUD と削除カスケードが動作する（#43 で実装）

## メモ

- `expo-sqlite` の最新 API（`openDatabaseAsync`）を使用。
- 外部キー制約・インデックス設計を含める（`PRAGMA foreign_keys = ON;`）。
