# #13 エディタ atom

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 3. 状態管理（Jotai atom）
- **前提**: #07

## 概要

`atoms/editor.ts` にエディタ画面で利用する atom を細分化して定義する。

## 受け入れ条件 (AC)

- [ ] `selectedDesignAtom`
- [ ] `selectedPolygonIdAtom`
- [ ] `pieceSettingsAtom`
- [ ] 派生 atom: `selectedPieceSettingAtom`
- [ ] atom 粒度は CLAUDE.md「atom の粒度」に準拠（小さく分割）
- [ ] すべて `debugLabel` を設定

## メモ

- 1 atom = 1 関心事の原則を遵守。
