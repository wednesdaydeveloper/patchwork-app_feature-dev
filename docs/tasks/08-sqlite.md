# #08 SQLite スキーマ・DB ユーティリティ

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 2. 型定義・データ層
- **前提**: #02, #07

## 概要

`utils/db.ts` で `expo-sqlite` を初期化し、テーブル作成・CRUD ヘルパー・マイグレーションを実装する。

## 受け入れ条件 (AC)

- [ ] テーブル: `fabric_images`, `works`, `piece_settings`
- [ ] 初回起動時にテーブルが作成される
- [ ] CRUD ヘルパー関数（insert / update / delete / select）が利用できる
- [ ] マイグレーション関数を用意（バージョン管理）
- [ ] 単体テストで CRUD が動作する

## メモ

- `expo-sqlite` の最新 API（`openDatabaseAsync`）を使用。
- 外部キー制約・インデックス設計を含める。
