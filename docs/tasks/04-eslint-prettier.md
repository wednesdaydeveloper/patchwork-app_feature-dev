# #04 ESLint / Prettier 設定

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #02

## 概要

ESLint・Prettier・import ソートプラグインを導入し、コード品質ルールを統一する。

## 受け入れ条件 (AC)

- [ ] `eslint-config-expo` を使った ESLint 設定
- [ ] Prettier と `@trivago/prettier-plugin-sort-imports` を設定
- [ ] `react-hooks/exhaustive-deps` ルール有効化
- [ ] `any` 禁止ルール有効化
- [ ] `npm run lint` がエラーなしで完走
- [ ] `npm run format` で全体が整形される

## メモ

- pre-commit フック（husky + lint-staged）の導入は別タスクで検討可。
