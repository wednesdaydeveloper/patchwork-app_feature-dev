# #74 調整画面: ピンチ拡大縮小を廃止し、2 本指回転を導入

- **ステータス**: `[x]` 完了
- **フェーズ**: 16. UX 改善
- **前提**: #31, #32
- **重要度**: 🔴 仕様変更 (破壊的)

## 概要

実寸対応(#71)により倍率調整の意義が薄れたため、ピース画像の `scale` プロパティを完全に廃止する。代わりに 2 本指ジェスチャを **回転(rotation)** に割り当てる。

## 受け入れ条件 (AC)

- [x] `PieceSetting` 型から `scale` を削除し、`rotation: number`(ラジアン)を追加
- [x] DB マイグレーション v4: `piece_settings` に `rotation REAL NOT NULL DEFAULT 0` 追加
- [x] 既存 `scale` カラムは保持(後方互換のため)。INSERT 時はハードコードで 1.0
- [x] DB SELECT は scale を読まずに `rotation` のみ復元(rotation=0 デフォルト)
- [x] `AdjustOverlay` で `Gesture.Pinch` を削除し、`Gesture.Rotation` を追加
- [x] 回転中心は画像中心(現状の offsetX/Y を考慮した位置)
- [x] 編集キャンバス・PDF・画像エクスポート全てで `rotation` を SVG transform に反映
- [x] 既存の単体テスト(`__tests__/editor-atoms.test.ts` 等)を新シグネチャに合わせて更新
- [x] 新規テスト: rotation 反映の round-trip

## メモ

- ファイル: `types/work.ts`, `atoms/editor.ts`, `utils/db.ts`, `components/canvas/PieceImage.tsx`, `features/editor/AdjustOverlay.tsx`, `features/editor/EditorCanvas.tsx`, `features/export/WorkCanvas.tsx`, `features/export/buildPdfHtml.ts`
- transform 順序: `translate(center) rotate(deg) scale(drawScalePerPx) translate(-imageCenter)` 等で画像中心まわりに回転
