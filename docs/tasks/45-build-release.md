# #45 ビルド・リリース準備

- **ステータス**: `[x]` 完了
- **フェーズ**: 12. 横断的な品質保証
- **前提**: #38, #39

## 概要

EAS Build 設定、`app.json` のパーミッション文言、アイコン・スプラッシュを整備する。

## 受け入れ条件 (AC)

- [x] `eas.json` を設定
- [x] iOS / Android のパーミッション文言を `app.json` に記載（カメラ・フォトライブラリ）
- [x] アイコン・スプラッシュ画像を設定
- [x] `eas build --platform all` がローカル設定で成功

## メモ

- iOS の `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` を必ず記載。
