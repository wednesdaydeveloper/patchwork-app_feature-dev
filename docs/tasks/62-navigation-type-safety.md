# #62 useNavigation の型安全化

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #48
- **重要度**: 🟢 改善 (I1)

## 概要

`EditorScreen` 内で `useNavigation()` を `as unknown as { addListener; dispatch }` でキャストしている。`@react-navigation/native` の型を直接 import して `useNavigation<NativeStackNavigationProp<...>>()` で受けるよう改善する。

## 受け入れ条件 (AC)

- [x] `as unknown as` キャストを除去
- [x] `addListener('beforeRemove', ...)` のイベント型が型推論される
- [x] 型チェックが引き続きパスする

## メモ

- ファイル: `features/editor/EditorScreen.tsx`
- expo-router は内部で react-navigation を使うため、型は `@react-navigation/native` 経由で利用可能。
