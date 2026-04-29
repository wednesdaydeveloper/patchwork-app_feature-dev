# #57 JPEG エクスポート時の透明領域を白背景で塗る

- **ステータス**: `[x]` 完了
- **フェーズ**: 14. レビュー対応
- **前提**: #52
- **重要度**: 🔴 不具合の可能性 (B4)

## 概要

`captureRef(format: 'jpg')` はプラットフォーム差異により SVG の `transparent` 領域を黒で塗ることが報告されている。現状 `WorkCanvas` は外側 View の背景に `#fff` を当てているが、ピース外領域や transparent path で黒塗りになるリスクがある。SVG 内に明示的な白背景レクタングルを描く。

## 受け入れ条件 (AC)

- [x] `WorkCanvas` に `backgroundFill?: string` プロパティを追加
- [x] JPEG エクスポート時のオフスクリーンキャンバスでは `backgroundFill="#ffffff"` を渡す
- [x] SVG 内最背面に `<Rect width="1" height="1" fill={backgroundFill} />` を描画
- [x] PNG エクスポート時(透明背景)は従来通り背景を描かない
- [x] iOS / Android 両方で JPEG 出力に黒い領域が含まれないことを確認

## メモ

- ファイル: `features/export/WorkCanvas.tsx`, `features/export/ExportScreen.tsx`
- #52 のメモにも本対策が記載されているが未実装。
