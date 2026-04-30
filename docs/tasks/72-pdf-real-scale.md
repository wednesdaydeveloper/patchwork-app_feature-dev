# #72 A4 実寸 PDF 出力

- **ステータス**: `[x]` 完了
- **フェーズ**: 15. 実寸対応
- **前提**: #39, #71
- **重要度**: 🔴 機能追加

## 概要

PDF 出力時に Work の `sizeMm` を物理単位として SVG/HTML に埋め込み、用紙にスケール 100% で印刷したときに実寸となるようにする。

## 受け入れ条件 (AC)

- [x] `buildPdfHtml` の SVG 出力で `width="${sizeMm}mm" height="${sizeMm}mm"` を使用
- [x] viewBox は `0 0 sizeMm sizeMm`(または 0..1 のまま `transform: scale(sizeMm)`)
- [x] 用紙サイズ A4(210×297mm)印刷可能領域を超える sizeMm の場合、警告ダイアログを出して縮小印刷の許可を取る(あるいは中止)
- [x] 既存の `scaleNote`(印刷スケール 100% を指定する旨)は維持
- [x] iOS / Android どちらの印刷ダイアログでも実寸が崩れないこと

## メモ

- ファイル: `features/export/buildPdfHtml.ts`, `features/export/ExportScreen.tsx`
- 印刷可能領域目安: A4 210×297mm、余白 10mm 取って 190×277mm
- 翻訳キー追加: `exportScreen.tooLargeTitle`, `exportScreen.tooLargeMessage`, `exportScreen.shrinkToFit`
