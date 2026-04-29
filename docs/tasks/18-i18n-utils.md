# #18 言語切替フック・ユーティリティ

- **ステータス**: `[x]` 完了
- **フェーズ**: 4. 多言語化（i18n）
- **前提**: #16, #17

## 概要

`useDesignName()` フックと `utils/format.ts`（ロケール別日付フォーマット）を実装する。

## 受け入れ条件 (AC)

- [x] `useDesignName(design)` がロケールに応じて `nameJa` / `name` を返す
- [x] `formatDate(date)` が `ja`: `yyyy/MM/dd`、`en`: `yyyy-MM-dd` で返す

## メモ

- 日付ライブラリは `date-fns` を推奨（軽量・ツリーシェイク可）。
