# #66 Stack ヘッダータイトルを多言語化

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #16, #17, #18
- **重要度**: 🔴 不具合

## 概要

`app/_layout.tsx` の `Stack.Screen options.title` が日本語でハードコードされており、英語に切り替えても日本語ヘッダーのまま表示される。`useTranslation` を使って言語切替に追従させる。

## 受け入れ条件 (AC)

- [x] パターン選択 / 編集 / エクスポート / 布地管理 / 設定 の各ヘッダーが選択言語で表示される
- [x] 設定画面で言語切替直後に既に開いている画面のヘッダーも更新される(再マウント不要)
- [x] 既存翻訳キー(`designSelect.title`, `fabrics.title`, `settings.title`, `editor.title`, `exportScreen.title`, `home.title`)を再利用する

## メモ

- ファイル: `app/_layout.tsx`
- `useI18n` がすでに `_layout` 内で呼ばれているので、同じコンポーネントで `useTranslation` を呼んで title に渡せばよい。
