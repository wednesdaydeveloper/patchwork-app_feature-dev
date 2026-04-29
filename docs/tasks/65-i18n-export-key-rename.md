# #65 翻訳キー `editor.export` のリネーム

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #49
- **重要度**: 🟢 改善 (I4)

## 概要

`locales/*.ts` で `editor.export` というキーを定義している。`export` は予約語ではないが、ECMAScript の予約語と紛らわしいため `editor.exportButton` または `editor.exportAction` にリネームする。

## 受け入れ条件 (AC)

- [x] `ja.ts` / `en.ts` の `editor.export` を `editor.exportAction` (仮)にリネーム
- [x] 参照箇所(`EditorScreen.tsx`)を追従
- [x] 型エラーなし、テストグリーン

## メモ

- ファイル: `locales/ja.ts`, `locales/en.ts`, `features/editor/EditorScreen.tsx`
- 似たキー名(`exportScreen.*`)との一貫性も意識する。
