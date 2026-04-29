# #45 ビルド・リリース準備

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 12. 横断的な品質保証
- **前提**: #38, #39

## 概要

EAS Build 設定、`app.json` のパーミッション文言、アイコン・スプラッシュを整備する。

## 受け入れ条件 (AC)

- [ ] `eas.json` を設定
- [ ] iOS / Android のパーミッション文言を `app.json` に記載（カメラ・フォトライブラリ）
- [ ] アイコン・スプラッシュ画像を設定
- [ ] `eas build --platform all` がローカル設定で成功

## メモ

- iOS の `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` を必ず記載。
