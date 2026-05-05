# #87 画像エクスポート: 保存先選択 (Sharing.shareAsync 化)

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 21. 編集 / エクスポート / 布地登録 UX 改善
- **前提**: #38, #85
- **重要度**: 🟢 機能改善

## 概要

エクスポート画面の「画像として保存」ボタンの挙動を、現状の **カメラロール直接保存** (`MediaLibrary.saveToLibraryAsync`) から **共有シート経由の保存先選択** (`Sharing.shareAsync`) に置き換える。

ユーザーは共有シートで以下を選択できる:

- 写真ライブラリへ保存
- ファイル / iCloud Drive / クラウドストレージへ保存
- 他アプリへ送信

SVG エクスポート (#85) と同じ UX に統一する。

## 背景 / 動機

- 現状は画像がカメラロールに固定で保存され、ユーザーが保存先を選べない
- SVG / PDF はすでに共有シート経由で保存先選択できるため、画像だけ仕様が異なる
- iOS / Android とも OS 標準の「フォルダ選択ダイアログ」は提供されないため、共有シートが現実解

## 受け入れ条件 (AC)

- [ ] 「画像として保存」ボタンを押すと共有シート (Share Sheet) が開く
- [ ] 共有シートで「写真に保存」「ファイルに保存」「他アプリで開く」等が選択できる
- [ ] PNG / JPEG いずれの形式でも動作する
- [ ] 共有シートが利用不可な場合 (`Sharing.isAvailableAsync` が false) はエラートーストを表示
- [ ] 失敗時はエラートーストで通知し、再試行可能 (既存挙動を踏襲)
- [ ] `MediaLibrary.requestPermissionsAsync` / `MediaLibrary.saveToLibraryAsync` の呼び出しを削除
- [ ] 関連翻訳キー (`exportScreen.permissionDeniedLibrary`) の整理 (削除または用途変更)
- [ ] 既存テストグリーン / 型チェック通過

## 実装方針

### `features/export/ExportScreen.tsx` の `handleExportImage` を改修

SVG エクスポート (`handleExportSvg`) と同じパターンを踏襲する:

1. ストレージチェック (`useStorageGuard`)
2. `captureRef` でキャンバスを画像化 (`result: 'tmpfile'` のまま)
3. 一時ファイルを `${cacheDirectory}${safeName}.${ext}` にコピー or リネーム (拡張子明示が必要)
4. `Sharing.isAvailableAsync()` チェック
5. `Sharing.shareAsync(fileUri, { mimeType, dialogTitle, UTI })` で共有シート起動
6. 成功時 / 失敗時のトースト表示

### MIME / UTI

| 形式 | mimeType | UTI |
| ---- | -------- | --- |
| PNG  | `image/png`  | `public.png` |
| JPEG | `image/jpeg` | `public.jpeg` |

### 一時ファイル名

SVG と同様に `${work.name.trim() || 'patchwork'}.${ext}` を `cacheDirectory` 配下に配置。
不正文字は SVG と同じ正規表現 (`/[\\/:*?"<>|]/g` → `_`) でサニタイズ。

### `expo-media-library` の扱い

画像エクスポートで参照しなくなる。**他箇所での利用がないか確認**してから依存削除を判断する (本タスクでは依存削除は行わず、参照だけ削除して別タスク化を検討)。

### 翻訳キー

- 削除候補: `exportScreen.permissionDeniedLibrary` (フォトライブラリ権限拒否時のメッセージ)
  - 共有シート方式では権限要求しないため不要
- 既存維持: `exportScreen.image` (ボタンラベル / dialogTitle 兼用)
- 既存維持: `exportScreen.saved` (成功トースト)

## メモ

- 共有シートの「写真に保存」を選んだ場合、OS 側でフォトライブラリ権限を要求する (アプリ側での事前要求は不要)
- iOS で UTI を正しく指定しないと共有先候補が制限されるため、PNG/JPEG で UTI を出し分ける
- ファイル拡張子を `.${ext}` で明示しないと、共有先アプリが mimeType を正しく認識しない可能性がある
