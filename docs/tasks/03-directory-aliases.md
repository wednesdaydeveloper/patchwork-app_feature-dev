# #03 ディレクトリ構成・パスエイリアス設定

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #01

## 概要

CLAUDE.md「ディレクトリ構成」に従ってフォルダを作成し、`@/*` パスエイリアスを設定する。

## 受け入れ条件 (AC)

- [ ] `app/`, `components/`, `atoms/`, `hooks/`, `constants/`, `locales/`, `types/`, `utils/` が存在する
- [ ] `tsconfig.json` の `paths` に `@/*` を設定
- [ ] `babel.config.js` に `babel-plugin-module-resolver` 等で同等エイリアスを設定
- [ ] `import x from '@/components/...'` が解決される

## メモ

- Expo Router 利用時は `app/` ディレクトリのみエイリアス対象から除外。
