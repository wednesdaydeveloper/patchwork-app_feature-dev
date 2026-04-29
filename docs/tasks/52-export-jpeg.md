# #52 JPEG エクスポートオプション

- **ステータス**: `[x]` 完了
- **フェーズ**: 13. UX 追加機能
- **前提**: #38

## 概要

画像エクスポートで PNG / JPEG をユーザーが選べるようにする（CLAUDE.md エクスポート要件「PNG または JPEG」）。

## 受け入れ条件 (AC)

- [x] エクスポート画面の「画像として保存」セクションに形式選択（PNG / JPEG）を追加
- [x] JPEG 選択時は `captureRef` の `format: 'jpg'` と `quality` を 0.9 程度で実行
- [x] 透明背景は PNG のみ（JPEG では白背景でラップ）
- [x] 翻訳キーを追加（`exportScreen.format` / `exportScreen.formatPng` / `exportScreen.formatJpeg`）

## メモ

- 用紙サイズ選択 UI（#39）と同じスタイルで形式選択を作ると統一感が出る。
- JPEG 用の白背景は `WorkCanvas` に `backgroundFill` プロパティを追加して切り替えるのが自然。
