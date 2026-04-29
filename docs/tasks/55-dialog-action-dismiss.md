# #55 Dialog アクション押下時の dismiss 挙動を確認・修正

- **ステータス**: `[x]` 完了(監査のみ)

## 監査結果

`components/ui/NotificationHost.tsx` の `DialogItem` で各アクションの `onPress` を `closeAndRun` でラップし、ユーザー関数実行後に必ず `dismissDialogAtom` で dequeue している。新規ダイアログを `onPress` 内から enqueue した場合も、enqueue → dismiss(現在のダイアログ) → 次のダイアログが head に来て表示、の順で正しく動作する。
キャンセル等の no-op アクションも `closeAndRun(() => {})` で確実に閉じられる。
追加修正は不要。
- **フェーズ**: 14. レビュー対応
- **前提**: #20
- **重要度**: 🔴 不具合 (B2)

## 概要

`Dialog` のアクションボタン押下時、ダイアログ自体が閉じる責務がどこにあるか曖昧。`actions[].onPress` で何もしない(キャンセル等)場合にダイアログが閉じない可能性がある。`NotificationHost` 側の dequeue ロジックも併せて確認する。

## 受け入れ条件 (AC)

- [x] アクションボタン押下時、必ずダイアログが閉じる(`dismissDialogAtom` で dequeue される)
- [x] アクションの `onPress` が独自に副作用(遷移・別ダイアログ表示など)を伴っても重複表示されない
- [x] `dismissOnBackdrop` の挙動と整合
- [x] 既存呼び出し箇所(布地削除確認、エラーダイアログ等)の挙動が変わらない

## メモ

- ファイル: `components/ui/Dialog.tsx`, `components/ui/NotificationHost.tsx`
- 修正案: `Dialog` の Button onPress 内で `action.onPress() → onDismiss()` の順で呼ぶ。`NotificationHost` 側で id ベースで dequeue。
