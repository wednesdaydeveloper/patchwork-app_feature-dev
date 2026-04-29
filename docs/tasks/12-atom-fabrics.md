# #12 布地 atom

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 3. 状態管理（Jotai atom）
- **前提**: #07, #08

## 概要

`atoms/fabrics.ts` に布地一覧・選択中布地の atom を定義する。

## 受け入れ条件 (AC)

- [ ] `fabricsAtom`: 布地一覧
- [ ] `selectedFabricIdAtom`: 選択中布地 ID
- [ ] DB から読み込み、追加／削除を反映する write-only atom を提供
- [ ] 派生 atom でカテゴリ別グルーピングを取得できる
- [ ] `debugLabel` を設定

## メモ

- 初回読み込みは `useEffect` で行い、atom にロード済みフラグを持たせる。
