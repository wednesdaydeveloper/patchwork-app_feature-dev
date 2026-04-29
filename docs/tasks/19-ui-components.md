# #19 汎用 UI コンポーネント

- **ステータス**: `[x]` 完了
- **フェーズ**: 5. 共通 UI コンポーネント
- **前提**: #06

## 概要

`components/ui/` に汎用コンポーネントを実装する。

## 受け入れ条件 (AC)

- [x] `Button.tsx`（押下時 / 無効状態あり）
- [x] `IconButton.tsx`
- [x] `Toast.tsx`
- [x] `Dialog.tsx`
- [x] Props 型は `interface` で定義
- [x] スタイルは `StyleSheet.create()` で同一ファイル末尾に定義

## メモ

- アクセシビリティ（`accessibilityLabel`, `accessibilityRole`）を含める。
