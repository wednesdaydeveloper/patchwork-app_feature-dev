# #63 updateFabric の DB 層で名前空文字をガード

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #50
- **重要度**: 🟢 改善 (I2)

## 概要

UI 側で名前空文字を `t('common.untitledFabric')` に置換しているが、DB 層 (`updateFabric`) にも防御的なガードを追加し、別経路から呼ばれても整合性を保つ。

## 受け入れ条件 (AC)

- [x] `updateFabric` 呼び出し時に `name.trim() === ''` の場合は `'Fabric'`(または別の既定値)に置換
- [x] 既存呼び出し元の挙動は変わらない
- [x] DB 単体テストで空文字ガードを検証

## メモ

- ファイル: `utils/db.ts`, `utils/db.test.ts`
- `insertFabric` にも同等のガードがあるか確認し、無ければ揃える。
