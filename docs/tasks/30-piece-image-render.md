# #30 ピース内画像描画（クリッピング）

- **ステータス**: `[x]` 完了
- **フェーズ**: 9. パッチワーク作成・編集画面
- **前提**: #27, #29

## 概要

SVG `clipPath` でピース形状にクリップして画像を描画する。

## 受け入れ条件 (AC)

- [x] 画像がピース形状（SVG path）にクリップされる
- [x] 初期状態は **画像が bbox を cover する最小倍率**（`scale=1.0` の定義）
- [x] 描画は CLAUDE.md「ピース内画像座標系」の式に従う
- [x] 複数ピースで独立して描画される

## メモ

- `react-native-svg` の `Image` + `ClipPath`（ピースの path を `Path` に与える）を利用。
- `fitScale = max(bbox.w / img.w, bbox.h / img.h)` で cover フィット。
- 描画位置は `(0.5 + offset) × bbox` を中心とする。
