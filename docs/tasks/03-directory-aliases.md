# #03 ディレクトリ構成・パスエイリアス設定

- **ステータス**: `[x]` 完了
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #01

## 概要

CLAUDE.md「ディレクトリ構成」に従ってフォルダを作成し、`@/*` パスエイリアスを設定する。

## 受け入れ条件 (AC)

- [x] `app/`, `features/`, `components/`, `atoms/`, `hooks/`, `constants/designs/`, `locales/`, `types/`, `utils/`, `assets/images/`, `assets/designs/` が存在する
- [x] `tsconfig.json` の `paths` に `@/*` を設定
- [x] ~~`babel.config.js` に `babel-plugin-module-resolver` 等で同等エイリアスを設定~~ → Expo Metro が tsconfig paths をネイティブ解決するため不要
- [ ] `import x from '@/components/...'` が解決される（実際の import を書いてからチェック）

## メモ

- Expo Router 利用時は `app/` ディレクトリのみエイリアス対象から除外。
- Expo SDK 49+ 以降、Metro が `tsconfig.json` の paths を自動解決するため babel-plugin-module-resolver は不要。
