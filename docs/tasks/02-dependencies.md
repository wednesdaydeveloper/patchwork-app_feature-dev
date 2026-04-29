# #02 依存パッケージ導入

- **ステータス**: `[x]` 完了
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #01

## 概要

CLAUDE.md「技術スタック」記載のライブラリを追加する。

## 受け入れ条件 (AC)

- [x] 以下が `package.json` に含まれる
  - `jotai`
  - `expo-router`
  - `react-native-svg`
  - `react-native-gesture-handler`
  - `react-native-reanimated`
  - `expo-sqlite`
  - `expo-image-picker`
  - `expo-file-system`
  - `i18next`
  - `react-i18next`
  - `expo-localization`
  - `react-native-view-shot`
  - `expo-media-library`
  - `expo-print`
  - `@react-native-async-storage/async-storage`
- [x] 型定義が解決され `tsc --noEmit` がエラーなしで通る

## メモ

- `expo install` を優先して使い、Expo SDK と互換性のあるバージョンを取得する。
