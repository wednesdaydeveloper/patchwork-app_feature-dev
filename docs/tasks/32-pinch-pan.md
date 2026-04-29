# #32 ピンチ・パン操作（位置・倍率調整）

- **ステータス**: `[x]` 完了
- **フェーズ**: 9. パッチワーク作成・編集画面
- **前提**: #31, #13

## 概要

`react-native-gesture-handler` の `Gesture.Pinch()` + `Gesture.Pan()` を `Simultaneous` で組み合わせ、`useSharedValue` で UI スレッド処理する。

## 受け入れ条件 (AC)

- [x] ピンチで倍率調整、パンで位置調整
- [x] 操作はリアルタイム（100ms 以内）でプレビュー反映
- [x] 確定時に `pieceSettingsAtom` へ反映
- [x] `offsetX`, `offsetY`, `scale` がピースごとに独立して保存

## メモ

- `runOnJS` で atom 更新を JS スレッドへ委譲。
- 倍率の上下限を設定（例: 0.1 〜 10.0）。
