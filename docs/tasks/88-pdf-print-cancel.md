# #88 印刷用 PDF: 印刷ダイアログのキャンセルをエラー扱いしない

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 21. 編集 / エクスポート / 布地登録 UX 改善
- **前提**: #39
- **重要度**: 🟡 不具合修正

## 概要

エクスポート画面の「印刷用 PDF」ボタンを押した後、iOS の印刷ダイアログで左上の「×」をタップしてキャンセルすると、`expo-print` が `ERR_PRINT_INCOMPLETE` エラーを throw する。現状はこれを「印刷データ生成失敗」として扱い、エラーダイアログ「印刷データの生成に失敗しました。Printing did not complete」が表示される。

ユーザー意図のキャンセルは正常動作のため、エラー扱いせず **silent** (ダイアログ・トースト・ログ出力なし) で終了する。

## 背景 / 動機

- 一般的な印刷キャンセル UX に倣い、キャンセル後はそのままエクスポート画面に戻るのが自然
- キャンセルのたびにエラーダイアログが出ると、ユーザーは何か問題があると誤認する
- 実際のエラー(メモリ不足等)時は従来通りエラーダイアログを表示する必要があるため、エラーコードで分岐する

## 受け入れ条件 (AC)

- [ ] 印刷ダイアログをキャンセル(×タップ)してもエラーダイアログが表示されない
- [ ] キャンセル時に `logger.error` が呼ばれない
- [ ] キャンセル時はトーストも表示しない (silent)
- [ ] 実際のエラー(`ERR_PRINT_INCOMPLETE` 以外)時は従来通りエラーダイアログを表示
- [ ] iOS で動作確認 (実機)
- [ ] 既存テストグリーン / 型チェック通過

## 実装方針

### `features/export/ExportScreen.tsx` の `runPdfExport` 改修

catch ブロック先頭でユーザーキャンセル判定を行い、該当時は早期リターン:

```ts
function isUserCancelledPrint(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === 'ERR_PRINT_INCOMPLETE';
}

// runPdfExport 内:
} catch (error) {
  if (isUserCancelledPrint(error)) {
    // ユーザーがキャンセルしただけなのでエラー扱いしない
    return;
  }
  logger.error('export', 'failed to export pdf', error, { paperSize });
  // ... 既存のエラーダイアログ表示
}
```

判別関数 `isUserCancelledPrint` は同ファイル内のローカルヘルパとして配置。テスト容易性のため export しても良い。

## メモ

- `expo-print` は印刷ダイアログのユーザーキャンセル時に Error オブジェクトを throw し、`code` プロパティに `'ERR_PRINT_INCOMPLETE'` を設定する
- iOS / Android で同じエラーコードか実機テスト時に確認 (Android では別コードの可能性)
- CLAUDE.md エラーハンドリング方針表に「印刷ダイアログのキャンセル」行を追加 (本タスクと同 PR で更新)
