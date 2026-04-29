# #06 グローバル Provider セットアップ

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #05

## 概要

`JotaiProvider`, `GestureHandlerRootView`, `SafeAreaProvider` をルートレイアウトに配置する。

## 受け入れ条件 (AC)

- [ ] 全画面で Jotai atom が利用できる
- [ ] ジェスチャーが iOS / Android 両方で動作する
- [ ] SafeArea が画面端で正しく扱われる

## メモ

- Reanimated は `babel.config.js` で `react-native-reanimated/plugin` を末尾に追加する必要あり。
