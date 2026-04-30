# #76 デバイスサイズ判定の基盤整備

- **ステータス**: `[x]` 完了
- **フェーズ**: 17. タブレット対応
- **前提**: #06
- **重要度**: 🔴 機能追加(基盤)

## 概要

スマホ / タブレットを判定する hook と breakpoint 定数を導入し、後続のレイアウト分岐の足場を作る。同時にタブレット時のみ横向きにロックする方針も組み込む。

## 受け入れ条件 (AC)

- [x] `hooks/useDeviceSize.ts` を新設
  - 戻り値: `{ kind: 'phone' | 'tablet'; width: number; height: number; isLandscape: boolean }`
  - 判定: 画面の短辺が **600 DP 以上** ならタブレット(Material Design / iOS の慣習)
- [x] `constants/breakpoints.ts`(または同等) を新設し、列数等で再利用する閾値を定義
- [x] `app.json` の orientation を `'default'` に変更(端末方向を許可)
- [x] 起動時(`_layout.tsx` または専用 hook)に `expo-screen-orientation` でロック制御
  - phone → `PORTRAIT`
  - tablet → `LANDSCAPE`
- [x] Apple 要件のため `ios.requireFullScreen: true` を設定(Split View 無効化)
- [x] 簡単な動作確認: phone エミュレータ / tablet エミュレータ両方で起動し orientation がロックされる

## メモ

- パッケージ追加: `expo-screen-orientation`
- ファイル: `hooks/useDeviceSize.ts`, `app/_layout.tsx`, `app.json`, `constants/breakpoints.ts`
- 短辺判定にすることで、回転中の一時的な誤判定を避ける
- 翻訳キー追加なし
