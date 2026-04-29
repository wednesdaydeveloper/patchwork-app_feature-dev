# #07 共通型定義

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 2. 型定義・データ層
- **前提**: #03

## 概要

CLAUDE.md「データモデル」「TypeScript 型定義」に準拠した型を `types/` に定義する。

## 受け入れ条件 (AC)

- [ ] `types/design.ts`: `Design`, `Polygon`, `DesignFile`（`design: Design` 単数）
- [ ] `Polygon.path: string`（SVG path data。`Point[]` は **使わない**）
- [ ] `Polygon.label`, `Design.category` は翻訳キーを保持する `string` 型
- [ ] `types/fabric.ts`: `FabricImage`
- [ ] `types/work.ts`: `Work`, `PieceSetting`
- [ ] すべて `interface` または `type` で export される
- [ ] `tsc --noEmit` がエラーなし

## メモ

- 座標系（bbox 基準正規化 / `scale=1.0` で cover フィット）の補足コメントを残す。
- `DesignFile` は **1 ファイル 1 デザイン** ラッパー（`{ version, design }`）。
