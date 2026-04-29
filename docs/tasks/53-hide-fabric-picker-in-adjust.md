# #53 調整モード中は布地選択パネルを非表示

- **ステータス**: `[x]` 完了
- **フェーズ**: 13. UX 追加機能
- **前提**: #29, #31

## 概要

「調整」ボタンで調整モードに入っているあいだ、画面下部の `FabricPicker`（布地選択パネル）を非表示にし、調整操作に集中できるようにする。

## 受け入れ条件 (AC)

- [x] `adjustModeAtom === true` のとき `FabricPicker` は描画されない
- [x] 「調整完了」で `adjustModeAtom` が `false` に戻ると `FabricPicker` が再表示される
- [x] 非表示中も `pieceSettingsAtom` などの状態は維持され、調整完了後に既存の選択状態がそのまま戻る

## メモ

- `features/editor/EditorScreen.tsx` で `<FabricPicker>` を `{!adjustMode && (...)}` でガード。
- 既存の `AdjustOverlay` の表示制御と対称。
- CLAUDE.md「2-3. 画像の調整」セクションに本仕様を反映。
