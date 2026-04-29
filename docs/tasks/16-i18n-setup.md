# #16 i18next セットアップ

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 4. 多言語化（i18n）
- **前提**: #02

## 概要

`utils/i18n.ts` で `i18next` を初期化し、端末ロケールを `expo-localization` で検出する。

## 受け入れ条件 (AC)

- [ ] `ja` / `en` 切替が動作する
- [ ] 端末ロケールが `ja` なら日本語、それ以外は英語
- [ ] `languagePreferenceAtom` の値変化に追従して言語切替

## メモ

- `getLocales()[0].languageCode` を利用。
- `react-i18next` の `I18nextProvider` をルートに配置。
