# #61 ロード失敗時に loaded フラグを必ず立てる

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #51
- **重要度**: 🟡 UX (U4)

## 概要

`loadFabricsAtom` / `loadWorksAtom` は失敗時に `*LoadedAtom = true` を立てない実装になっており、ロード失敗時にスピナーが永遠に表示される。`try/finally` で必ず `loaded = true` を保証する。

## 受け入れ条件 (AC)

- [x] `loadFabricsAtom` の失敗パスでも `fabricsLoadedAtom = true` が立つ
- [x] `loadWorksAtom` の失敗パスでも `worksLoadedAtom = true` が立つ
- [x] 失敗時はトースト or 空状態メッセージで状況を提示
- [x] 既存の正常系テストが引き続きパスする

## メモ

- ファイル: `atoms/fabrics.ts`, `atoms/works.ts`
- 実装は `try { listFabrics() } finally { set(fabricsLoadedAtom, true) }` で十分。
