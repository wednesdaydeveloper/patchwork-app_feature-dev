# #70 布地キャリブレーション UX(定規 + ピンチ整合)

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 15. 実寸対応
- **前提**: #08, #24, #69
- **重要度**: 🔴 機能追加

## 概要

布地登録時に画像のピクセル数と物理サイズの対応(`pxPerMm`)を取得する。画面上に物理サイズベースの定規を表示し、ユーザーが画像をピンチ・パンで定規に合わせるキャリブレーション UI を導入する。

## 受け入れ条件 (AC)

- [ ] `FabricImage` 型に `pxPerMm: number | null` を追加(NULL 許容、未キャリブレーション)
- [ ] DB マイグレーション v3(または v2 と統合): `fabric_images.px_per_mm REAL NULL`
- [ ] 布地登録フロー: 画像選択 → 名前/カテゴリ入力 → **キャリブレーション画面** → 保存
- [ ] キャリブレーション画面: 定規(0〜150mm 目盛、1 DP = 0.15875mm 換算)+ 画像(ピンチ/パン)+ ライブ「画像幅 = NNN mm」表示
- [ ] 「保存」で `pxPerMm = imagePx.w / 算出 mm` を計算して DB に保存
- [ ] 「キャンセル」で布地登録自体を中止
- [ ] 布地一覧画面: 未キャリブレーション布地が存在する場合に上部警告バナー表示
- [ ] 布地編集ダイアログから再キャリブレーション可能(リンク or ボタン)
- [ ] 既存(マイグレーション前)布地は pxPerMm=NULL になり、警告対象に含まれる

## メモ

- ファイル: `features/fabrics/CalibrationScreen.tsx`(新規)、`useFabricRegister.ts` 改修、`FabricsScreen.tsx` バナー追加、`utils/db.ts` 改修
- ピンチ/パン: `react-native-gesture-handler` の `Gesture.Pinch()` + `Gesture.Pan()` を `Gesture.Simultaneous()` 合成
- mm→DP: `mm * 160 / 25.4`(Android 標準ベース)
- 機種により定規実寸が ±5% 程度ずれることをドキュメント注記
- 翻訳キー追加: `fabrics.calibrate`, `fabrics.calibrationTitle`, `fabrics.calibrationHint`, `fabrics.imageWidthMm`, `fabrics.uncalibratedWarning`
