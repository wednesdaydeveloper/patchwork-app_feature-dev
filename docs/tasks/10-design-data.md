# #10 パターン初期データ（JSON）作成

- **ステータス**: `[x]` 完了
- **フェーズ**: 2. 型定義・データ層
- **前提**: #07

## 概要

`constants/designs/` に Nine Patch / Variable Star など初期パターンを JSON で配置し、ローダを実装する。

## 受け入れ条件 (AC)

- [x] 最低 3 種類の初期パターンが提供される
- [x] **1 ファイル 1 デザイン** とし、トップ階層は `{ version, design }` 形式
- [x] `Polygon.path` は SVG path data（正規化座標 0.0〜1.0、`Z` で閉じる）
- [x] `Polygon.label` / `Design.category` は翻訳キー（例: `topLeft`, `threeGrid`）
- [x] `constants/designs/index.ts` でパターン読み込みローダを実装
- [x] サムネイルは `assets/designs/<id>.png` に配置し、`require()` で静的解決
- [x] パース失敗時にエラー画面が表示される（開発時のみ）

## メモ

- スキーマ検証（zod 等）の利用は別タスクでも可。
- 直線多角形以外（円・円弧・ベジェ曲線）にも対応できる設計を維持。

### パターン定義の幾何バリデーション（開発時のみ）

CLAUDE.md「用語定義」のパターン制約（隙間なし・重なりなし・矩形外への逸脱なし・ピース線の自己交差なし）を機械的に検証する。

- 実行タイミング: 開発ビルド時 / テストでのみ実行（本番ビルドではスキップ）
- 推奨ライブラリ: `polygon-clipping` または `martinez-polygon-clipping`
- 検証ステップ:
  1. 各 `Polygon.path` を SVG パーサで近似ポリラインに変換（曲線は十分な解像度でサンプリング）
  2. 各ポリゴンの **自己交差検査**（Shamos–Hoey 等）→ NG なら `error.designSelfIntersect` で通知
  3. ペア毎の **重なり検査**（bbox で粗フィルタ → 厳密判定）→ NG なら `error.designOverlap`
  4. **ユニオンの面積** が 1.0 ± ε（例: 1e-6）であることを確認 → NG なら `error.designAreaMismatch`
  5. 全頂点・サンプル点が `[0, 1]` の範囲内であることを確認 → NG なら `error.designOutOfBounds`
- 失敗時は CLAUDE.md「エラーハンドリング方針」に従いエラー画面を表示（パターンJSONパース失敗と同様）
