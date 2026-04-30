# #77 ホーム / パターン選択 / 布地一覧のグリッド列数を可変化

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 17. タブレット対応
- **前提**: #76
- **重要度**: 🟡 UX

## 概要

タブレット時に各画面のグリッド列数を増やし、画面幅を活かす。

## 受け入れ条件 (AC)

- [ ] パターン選択(`DesignSelectScreen`): phone 2 列 → tablet 4 列
- [ ] ホームの保存済み作品一覧: phone 1 カラム → tablet 2 カラム(SectionList/FlatList の `numColumns` 切替)
- [ ] 布地一覧(`FabricsScreen`): phone 1 カラム → tablet 2 カラム
- [ ] アイテムサイズ(サムネイル等)も画面幅に応じて拡大
- [ ] 既存テストグリーン

## メモ

- ファイル: `features/design-select/DesignSelectScreen.tsx`, `features/home/HomeScreen.tsx`, `features/fabrics/FabricsScreen.tsx`
- `useDeviceSize` 経由で列数を決定
- 列数を変えると `keyExtractor` / `key` の安定性に注意(numColumns 変更時はリスト全体を再描画させる必要があるケースあり)
