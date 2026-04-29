# #17 翻訳定義（ja / en）

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 4. 多言語化（i18n）
- **前提**: #16

## 概要

`locales/ja.ts` を真とし、`Translations = typeof ja` 型を `locales/en.ts` に強制する。

## 受け入れ条件 (AC)

- [ ] `locales/ja.ts` に主要画面のキーが定義済み
- [ ] `locales/en.ts` で同一スキーマを満たす
- [ ] ピースラベル `piece.<key>` を含む（`topLeft`, `center`, `topTriangle` など）
- [ ] パターンカテゴリ `category.<key>` を含む（`threeGrid`, `fourGrid` など）
- [ ] `Translations` 型で型エラーなく両言語のキーが一致

## メモ

- ネームスペース: `home.*`, `editor.*`, `fabrics.*`, `export.*`, `settings.*`, `common.*`, `piece.*`, `category.*`, `error.*`。
