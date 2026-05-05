# #85 エクスポート画面: SVG 出力

- **ステータス**: `[x]` 完了
- **フェーズ**: 21. エクスポート機能拡張
- **前提**: #38, #39
- **重要度**: 🟢 機能追加

## 概要

エクスポート画面に「SVG として保存」ボタンを追加する。
PNG/JPEG ボタンの隣に配置。タップするとファイル保存ダイアログ (Share Sheet 経由のファイル保存) が起動し、
ユーザーが任意の場所に SVG ファイルを保存できる。

## 受け入れ条件 (AC)

- [x] エクスポート画面に「SVG として保存」ボタンを追加 (PNG/JPEG の隣)
- [x] SVG は **単一ファイル完結** (画像は base64 data URI で埋め込み)
- [x] viewBox `0 0 1 1`、width/height は `${sizeMm}mm` で実寸再現
- [x] ピース形状を ClipPath、布地は `<image>` で配置 (PDF 出力と同じ計算式)
- [x] 出力後にファイル保存ダイアログ (`expo-sharing` の `shareAsync` 経由でファイル保存・他アプリ送信を選択可能) を表示
- [x] 失敗時はエラートーストで通知し、再試行可能
- [x] 既存テストグリーン / 型チェック通過

## メモ

- 実装案:
  - `features/export/buildPdfHtml.ts` の SVG 生成ロジック (内側の `<svg>...</svg>`) を抽出して共通化
  - 新規 `features/export/buildSvg.ts` で純粋に SVG 文字列を返す関数を作成
  - `expo-file-system` で一時ファイルとして書き出し → `expo-sharing` で共有
- 依存: `expo-sharing` を必要に応じて追加 (既存の有無を確認してから)
- ファイル: `features/export/ExportScreen.tsx`, `features/export/buildSvg.ts` (新), `features/export/buildPdfHtml.ts`
