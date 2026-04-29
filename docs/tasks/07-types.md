# #07 共通型定義

- **ステータス**: `[x]` 完了
- **フェーズ**: 2. 型定義・データ層
- **前提**: #03

## 概要

CLAUDE.md「データモデル」「TypeScript 型定義」に準拠した型を `types/` に定義する。

## 受け入れ条件 (AC)

- [x] `types/design.ts`: `Design`, `Polygon`, `DesignFile`（`design: Design` 単数）
- [x] `Polygon.path: string`（SVG path data。`Point[]` は **使わない**）
- [x] `Polygon.label`, `Design.category` は翻訳キーを保持する `string` 型
- [x] `types/fabric.ts`: `FabricImage`
- [x] `types/work.ts`: `Work`, `PieceSetting`
- [x] すべて `interface` または `type` で export される
- [x] `tsc --noEmit` がエラーなし

## メモ

- 座標系（bbox 基準正規化 / `scale=1.0` で cover フィット）の補足コメントを残す。
- `DesignFile` は **1 ファイル 1 デザイン** ラッパー（`{ version, design }`）。
