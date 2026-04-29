# #05 Expo Router レイアウト雛形

- **ステータス**: `[x]` 完了
- **フェーズ**: 1. プロジェクト基盤セットアップ
- **前提**: #02, #03

## 概要

`app/_layout.tsx` を作成し、ルートのナビゲーションを設定する。

## 受け入れ条件 (AC)

- [x] 起動時に `app/index.tsx`（仮ホーム）が表示される
- [x] 画面遷移 API（`router.push` / `Link`）が動作する
- [x] 動的ルート（`editor/[id].tsx`、`export/[id].tsx`）の雛形を配置

## メモ

- ルートファイルは薄いラッパーにとどめる方針（CLAUDE.md「Expo Router」参照）。
