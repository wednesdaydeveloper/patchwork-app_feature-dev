# #75 布地編集ダイアログに「キャリブレーション再実行」ボタンを追加

- **ステータス**: `[x]` 完了
- **フェーズ**: 16. UX 改善
- **前提**: #50, #70
- **重要度**: 🟡 UX

## 概要

キャリブレーション済の布地でも後から再キャリブレーションできるよう、布地一覧アイテムをタップした際の編集ダイアログに「キャリブレーションを再実行」ボタンを追加する。

## 受け入れ条件 (AC)

- [x] 布地編集ダイアログに「キャリブレーションを再実行」ボタンを追加
- [x] ボタン押下で編集ダイアログを閉じ、`CalibrationScreen` を開く
- [x] キャリブ確定で `pxPerMm` のみ更新(名前/カテゴリは編集ダイアログで入力した値を反映する or 既存値維持)
- [x] キャリブ画面をキャンセルした場合は元の値を維持
- [x] 未キャリブレーション布地の自動再キャリブ(現仕様)は維持
- [x] アクセシビリティラベル設定

## メモ

- ファイル: `features/fabrics/FabricsScreen.tsx`, `components/ui/PromptDialog.tsx`(extraAction を追加)
- `PromptDialog` に optional `extraAction?: { label, onPress, variant? }` プロパティを追加し、submit/cancel の上部に表示
- 翻訳キー: `fabrics.recalibrate`
