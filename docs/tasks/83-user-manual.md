# #83 操作マニュアル整備とスクリーンショット差し込み

- **ステータス**: `[~]` 進行中 (本文作成済み、画像待ち)
- **フェーズ**: 20. ドキュメント
- **前提**: 既存機能 (#01〜#80)
- **重要度**: 🟢 ドキュメント

## 概要

一般ユーザー向けの操作マニュアルを `docs/USER_MANUAL.md` に整備する。
本文は CLAUDE.md と docs/tasks/README.md の内容から作成済み。
スクリーンショット差し込みのため、画像を `docs/manual/screenshots/` に番号付きで配置し、本文へリンクを埋め込む。

## 受け入れ条件 (AC)

### 本文
- [x] `docs/USER_MANUAL.md` を作成 (11 章構成、撮影リスト付き)

### スクリーンショット (必須 8 枚)
- [ ] `01-home.png` ホーム画面 (作品が数件ある状態)
- [ ] `02-fabric-source-pick.png` 布地登録の撮影方法選択ダイアログ
- [ ] `03-calibration.png` キャリブレーション画面 (ルーラと布地)
- [ ] `04-fabrics-list.png` 布地管理画面 (数点登録された一覧)
- [ ] `05-design-select.png` パターン選択画面 (グリッド)
- [ ] `08-editor-piece-selected.png` 編集画面: ピース選択中
- [ ] `10-adjust-mode.png` 調整モード画面 (拡大表示)
- [ ] `13-export.png` エクスポート画面 (PNG/JPEG/PDF オプション)
- [ ] `15-settings.png` 設定画面 (言語選択)

### スクリーンショット (推奨)
- [ ] `06-size-input.png` サイズ指定画面
- [ ] `07-editor-empty.png` 編集画面: 未選択状態
- [ ] `09-editor-completed.png` 編集画面: 全ピース割当済み
- [ ] `11-save-dialog.png` 保存ダイアログ (名前入力中)
- [ ] `12-home-swipe-delete.png` 作品一覧 + 左スワイプ削除メニュー
- [ ] `14-pdf-preview.png` 印刷用 PDF プレビュー (1 ページ全体)
- [ ] `16-leave-guard.png` 未保存変更の離脱ガードダイアログ
- [ ] `17-storage-full.png` ストレージ容量不足の警告ダイアログ

### タブレット用 (推奨)
- [ ] `05-design-select-tablet.png` パターン選択 (T)
- [ ] `07-editor-tablet.png` 編集画面: 横並びレイアウト (T)

### 差し込み作業
- [ ] 各章の `📸 **スクリーンショット推奨**` セクションを `![alt](manual/screenshots/NN-xxx.png)` に置換
- [ ] 撮影リスト (章末) のチェックを更新

## メモ

- ファイル形式: PNG (アスペクト比は端末スクショの自然比)
- 配置先: `docs/manual/screenshots/`
- 命名規則: `NN-snake-case.png` (NN は撮影リストの番号 01〜17)
- スマホ用は縦向き、タブレット用は `-tablet` サフィックスで区別
- マニュアル本文への画像リンクの差し込みはユーザーから「画像作成完了」の連絡を受けてから着手する
