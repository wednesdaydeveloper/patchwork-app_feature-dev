# #15 パッチワーク（Work）atom

- **ステータス**: `[x]` 完了
- **フェーズ**: 3. 状態管理（Jotai atom）
- **前提**: #07, #08

## 概要

`atoms/works.ts` に保存済みパッチワーク一覧 atom を定義する。

## 受け入れ条件 (AC)

- [x] `worksAtom`: Work 一覧
- [x] DB から読み込み、保存／削除が反映される
- [x] `debugLabel` を設定

## メモ

- 並び順は `updatedAt` 降順をデフォルトとする派生 atom を用意。
