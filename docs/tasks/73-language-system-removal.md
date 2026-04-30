# #73 言語設定「端末設定に従う」を廃止

- **ステータス**: `[x]` 完了
- **フェーズ**: 16. UX 改善 (実寸対応の後追い)
- **前提**: #11, #16, #18
- **重要度**: 🔴 仕様変更

## 概要

設定画面の言語選択肢から「端末設定に従う」を削除し、`日本語` / `English` の 2 択にする。アプリ起動時に保存値が無効(過去の `'system'` を含む)な場合は端末ロケールから自動判定して `'ja'` または `'en'` に書き換える。

## 受け入れ条件 (AC)

- [x] `LanguagePreference` 型は `'ja' | 'en'`(`'system'` を削除)
- [x] `atomWithStorage` の初期値は端末ロケール検出関数の結果(ja → 'ja'、それ以外 → 'en')
- [x] 既存ユーザーで保存値が `'system'` の場合、起動時に検出した値で上書きする
- [x] 設定画面のラジオは「日本語」「English」の 2 択
- [x] 翻訳キー `settings.languageSystem` は削除(参照も全て除去)

## メモ

- ファイル: `atoms/settings.ts`, `utils/i18n.ts` or `utils/language.ts`, `features/settings/SettingsScreen.tsx`, `locales/*.ts`
- マイグレーション: AsyncStorage の値が `'system'` を返した場合は副作用付き hook(useI18n 等)で `set('ja' | 'en')` する
