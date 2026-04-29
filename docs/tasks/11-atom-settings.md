# #11 設定 atom（言語）

- **ステータス**: `[x]` 完了
- **フェーズ**: 3. 状態管理（Jotai atom）
- **前提**: #02, #06

## 概要

`atoms/settings.ts` に `languagePreferenceAtom` を `atomWithStorage` で定義する。

## 受け入れ条件 (AC)

- [x] `'system' | 'ja' | 'en'` の値を保持
- [x] AsyncStorage に永続化される
- [x] `debugLabel` を設定

## メモ

- `createJSONStorage(() => AsyncStorage)` でストレージを指定。
