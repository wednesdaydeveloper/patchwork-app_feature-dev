# #07 共通型定義

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 2. 型定義・データ層
- **前提**: #03

## 概要

CLAUDE.md「データモデル」「TypeScript 型定義」に準拠した型を `types/` に定義する。

## 受け入れ条件 (AC)

- [ ] `types/design.ts`: `Design`, `Polygon`, `Point`, `DesignFile`
- [ ] `types/fabric.ts`: `FabricImage`
- [ ] `types/work.ts`: `Work`, `PieceSetting`
- [ ] すべて `interface` または `type` で export される
- [ ] `tsc --noEmit` がエラーなし

## メモ

- 座標系（パターン座標 / ピース内画像座標）の補足コメントを残す。
