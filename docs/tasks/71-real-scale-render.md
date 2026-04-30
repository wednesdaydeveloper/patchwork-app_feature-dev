# #71 ピース内画像の実寸描画 / preserveAspectRatio 修正

- **ステータス**: `[x]` 完了
- **フェーズ**: 15. 実寸対応
- **前提**: #69, #70
- **重要度**: 🔴 機能追加 + 不具合修正

## 概要

`PieceImage` の描画式を、Work の `sizeMm` と FabricImage の `pxPerMm` を用いて画像が実寸で表示されるよう改修する。同時に `preserveAspectRatio="none"` による画像引き伸ばし不具合も修正する。

## 受け入れ条件 (AC)

- [x] `PieceImage` のシグネチャに `sizeMm` と `pxPerMm` を追加
- [x] `scale = 1.0` のとき、画像が「画像横幅 mm / sizeMm」の正規化幅で表示される(実寸)
- [x] `preserveAspectRatio` をデフォルト("xMidYMid meet" など)に変更し、画像の縦横比を維持
- [x] 画像が piece bbox より小さい場合の扱いを仕様化(空白可、もしくは「画像が小さすぎる」案内)
- [x] 未キャリブレーション(`pxPerMm = null`)布地は旧来の cover ロジックでフォールバック描画
- [x] エディタプレビュー / オフスクリーンエクスポート両方で機能
- [x] 既存テストがパス(必要なら期待値を更新)

## メモ

- ファイル: `components/canvas/PieceImage.tsx`, `features/editor/EditorCanvas.tsx`, `features/export/WorkCanvas.tsx`
- `WorkCanvas` / `EditorCanvas` から `sizeMm` と各 fabric の `pxPerMm` を `PieceImage` に渡す
- 既存 `PieceSetting.scale` の意味は変わる(実寸基準の倍率)。リリース時に「既存作品の表示が変わる可能性」を案内
- AdjustOverlay(調整モード)の挙動も合わせて確認
