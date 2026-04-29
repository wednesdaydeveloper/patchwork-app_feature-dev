# パフォーマンス検証手順

CLAUDE.md「非機能要件 / パフォーマンス」と #44 の AC に基づく検証ガイド。

## 計測対象

| 項目                          | 目標            | 計測場所                         |
| ----------------------------- | --------------- | -------------------------------- |
| ホーム一覧スクロール          | 60fps 維持      | Performance Monitor              |
| 布地一覧スクロール            | 60fps 維持      | Performance Monitor              |
| パターン選択グリッド          | 60fps 維持      | Performance Monitor              |
| ピンチ／パン操作の反映遅延    | 100ms 以内      | 体感 + Reanimated DevTools       |
| 編集画面のピース再描画        | 60fps 維持      | Performance Monitor + React DevTools Profiler |

## 計測方法

### Performance Monitor

1. デバッグメニューを開き「Show Perf Monitor」を有効化
2. 該当画面で操作を行いつつ FPS（JS / UI）をチェック
3. 60fps を下回るシーンを記録

### React DevTools Profiler

1. React Native DevTools を起動し、Profiler タブで記録開始
2. 操作を再現
3. 「Why did this render?」で不要な再描画コンポーネントを特定

### Reanimated（ジェスチャー）

- `useSharedValue` を使った値はワークレット側で更新されるため JS スレッドのフレーム落ちが起きにくい
- `runOnJS` で state を更新する箇所はジェスチャー終了時のみに限定する（現状の `AdjustOverlay.commit` を踏襲）

## 既存の最適化

- `Piece` / `WorkListItem` / `FabricListItem` を `React.memo` でラップ（同一 props 再描画を抑制）
- `useSampledPolygons` で path サンプリング結果をキャッシュ（編集中は同じ Design なら 1 回のみ計算）
- `EditorCanvas` 内の `settingsByPolygon` / `fabricsById` / `bboxById` を `useMemo` で再計算抑制
- 画像座標は `useAnimatedProps` で UI スレッド更新（ジェスチャー中は React 再描画なし）
- リストはすべて `FlatList` または `SectionList`（`map` で大量描画していない）
- パッチワーク履歴は最大 20 件にキャップ（`atoms/history.ts`）

## 過剰メモ化を避ける

- 計測してから最適化（CLAUDE.md「コーディングスタイル」）
- 単純な props しか持たない静的なテキストコンポーネントには `React.memo` を付けない
- 子コンポーネントに渡すコールバックが毎回新規生成されている場合のみ `useCallback` を検討

## 既知の懸念点と対応

| 懸念                                       | 状態                                            |
| ------------------------------------------ | ----------------------------------------------- |
| 大量のピースを含む新パターン追加時の描画   | パターンは現状 3 種類。pieces 数 ≤ 21 のため問題なし。将来 50 ピース超のパターンが入った場合は `Piece` の `key` 戦略と `Path` の strokeWidth スケールを再検証 |
| 高解像度オフスクリーンキャプチャ           | 1080×1080 で問題なし。4K 級にする場合は計測必要 |
| 布地一覧の画像サムネイルロード             | 現状 1 件ずつ `<Image source={{uri}}>`。100 件超想定なら `getSize` のキャッシュ層を追加 |
