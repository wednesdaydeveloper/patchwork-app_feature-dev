# #69 Work.sizeMm 追加 / パッチワークサイズ指定

- **ステータス**: `[x]` 完了
- **フェーズ**: 15. 実寸対応
- **前提**: #07, #08, #15
- **重要度**: 🔴 機能追加

## 概要

パッチワークの一辺の物理サイズ(mm)を `Work` に保持する。「新規パッチワーク作成」フローを「パターン選択 → サイズ指定 → エディタ」の 2 ステップに変更する。

## 受け入れ条件 (AC)

- [x] `Work` 型に `sizeMm: number` を追加(50 ≤ sizeMm ≤ 280)
- [x] DB マイグレーション v2: `works` に `size_mm REAL NOT NULL DEFAULT 150` を追加
- [x] 既存 Work は size_mm=150 にデフォルトされる
- [x] `saveWork` / `findWorkById` / `listWorks` が sizeMm を保存・復元
- [x] 新規作成フロー: ホーム「新規パッチワークを作成」→ パターン選択 → 新画面「サイズ選択」(範囲 50〜280mm、デフォルト 150)→ エディタへ
- [x] エディタ画面ヘッダーに現在の sizeMm を表示し、タップでサイズ変更ダイアログ
- [x] サイズ変更は履歴(canUndo)とは独立した「未保存変更」扱い(#58 と同等)
- [x] 既存単体テストが引き続きパスする
- [x] 簡易テスト追加(sizeMm round-trip、バリデーション境界値)

## メモ

- 新画面: `app/new-work/size.tsx` + `features/new-work/SizeSelectScreen.tsx`
- エディタ atom に `editingWorkSizeMmAtom` / `editingWorkSizeMmDirtyAtom` を追加
- サイズ入力 UI はシンプルな数値入力 + 範囲バリデーション(スライダー追加は将来)
- 描画には未使用(15C で利用)。15A は値の保持・受け渡しのみ。
- 翻訳キー追加: `newWorkSize.title`, `newWorkSize.label`, `newWorkSize.hint`, `newWorkSize.invalidRange`, `editor.size`, `editor.changeSize` 等
