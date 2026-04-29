# #27 キャンバス基盤コンポーネント

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 9. パッチワーク作成・編集画面
- **前提**: #07, #10

## 概要

`components/canvas/PatternCanvas.tsx` を実装し、`react-native-svg` の `Path` コンポーネントでピースを描画する。

## 受け入れ条件 (AC)

- [ ] 任意のパターン（`Polygon.path` の SVG path data）を正しい比率で描画
- [ ] 正規化座標 → 端末ピクセル座標の変換ユーティリティを実装
- [ ] ピース bbox の計算ユーティリティを実装（path から minX/minY/width/height を取得）
- [ ] `React.memo` で再描画最小化

## メモ

- ピース描画は子コンポーネント `Piece.tsx` に切り出す。
- bbox 計算は path のサンプリングから求める（曲線対応）。
- 描画式は CLAUDE.md「ピース内画像座標系」を参照。
