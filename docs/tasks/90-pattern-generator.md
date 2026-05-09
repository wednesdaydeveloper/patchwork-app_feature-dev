# #90 パターン生成ツール: 画像から SVG path JSON を半自動生成

- **ステータス**: `[ ]` 未着手
- **フェーズ**: 22. パターンマスター拡充(開発者ツール)
- **前提**: なし
- **重要度**: 🟢 機能追加(開発者ツール)

## 概要

パッチワーク書籍のスキャン画像 (PNG/JPG) からパターン JSON を半自動生成する **Web ツール** を `tools/pattern-generator/` に新設する。`constants/designs/*.json` のパターン数を現在の 3 件から数十〜数百件まで拡充するための **開発者向けツール**(エンドユーザー向け機能ではない)。

## 背景 / 動機

- 現状 `constants/designs/` には 3 件のみで、ユーザーが選べる種類が乏しい
- パッチワーク書籍には数百種類のパターンが掲載されており、それらを取り込みたい
- 1 件ずつ手動で SVG path data を書くのは現実的でない(多角形は座標計算、曲線はベジェ制御点設計が必要)
- アプリ内エンドユーザー向け機能とは独立に、開発者ツールとして構築する

## ターゲット規模

| Phase | 想定件数 | パターン種別 |
|---|---|---|
| Phase 1 (MVP) | 20〜50 件 | 直線多角形(グリッド系) |
| Phase 2 | 30〜100 件追加 | 曲線(円・円弧・ベジェ)を含むパターン |
| Phase 3 | 残り | 完全自動化の精度向上(可能な範囲) |

## 想定アーキテクチャ(パイプライン)

```
[1] パターン画像 (PNG/JPG)
      ↓ 画像処理(自動)
        - グレースケール化
        - 2 値化 (Otsu thresholding)
        - 細線化 (thinning) / ノイズ除去
[2] 線画(処理済み画像)
      ↓ ベクトル化(自動)
        - imagetracer.js / potrace.js
[3] SVG line drawing
      ↓ ピース分割(半自動)
        - 閉領域検出 (planar subdivision)
        - or 開発者がクリックで領域選択
[4] ピース候補(SVG path 群)
      ↓ GUI レビュー(手動)
        - 各ピースに id / label を割り当て
        - メタ情報入力(name, nameJa, category, gridSize)
        - 既存 utils/designValidator で検証
[5] JSON + サムネイル PNG をダウンロード
   (開発者がリポジトリへ手動配置)
```

## 受け入れ条件 (AC)

### Phase 1: グリッド系パターン MVP

- [ ] `tools/pattern-generator/` に Vite + React の Web ツールを配置
- [ ] 画像を D&D で取り込める
- [ ] 画像を 2 値化・細線化 → ベクトル化して SVG path 候補を生成
- [ ] グリッド系(2×2, 3×3, 4×4, 5×5)のピース分割を自動提案
- [ ] GUI でピース境界を確認・微調整(クリック選択、各ピースに id/label を割り当て)
- [ ] メタ情報入力フォーム: `id`, `name`, `nameJa`, `category`, `gridSize`, `thumbnail`
- [ ] 既存 `utils/designValidator` で出力 JSON を検証(再利用)
- [ ] **JSON ファイル + サムネイル PNG ダウンロード**(手動配置方式)
- [ ] `tools/pattern-generator/README.md` に操作マニュアル
- [ ] Phase 1 で直線多角形パターンを **20〜50 件** 実用的に作成可能

### Phase 2: 曲線パターン対応

- [ ] 円・円弧・ベジェ曲線を SVG path data として出力
- [ ] 曲線を制御点で表示・編集できる UI
- [ ] 曲線パターンを **30〜100 件** 追加作成可能

### Phase 3: 完全自動化向上

- [ ] グリッドパターンは画像投入だけで JSON 自動生成(高精度)
- [ ] 認識精度の改善(角度補正、ノイズ除去、傾き補正)
- [ ] バッチ処理(複数画像をまとめて変換)
- [ ] (任意)CLI 補助スクリプト `npm run gen-pattern --commit` で生成 → リポジトリ自動配置

## 技術選択

| 項目 | 採用候補 | 備考 |
|---|---|---|
| ベクトル化 | imagetracer.js / potrace.js | ブラウザで動作する純 JS 実装 |
| 画像処理 | OpenCV.js / Canvas API | 2 値化・細線化・エッジ検出 |
| GUI フレームワーク | Vite + React + TypeScript | 既存リポジトリと TS / 型を共有 |
| SVG 操作 | svgo / @svgdotjs/svg.js | path data 正規化・座標変換 |
| 検証 | `utils/designValidator`(既存) | 本体と同じスキーマで検証 |

## ディレクトリ配置

```text
tools/
└── pattern-generator/
    ├── package.json       # Vite + React サブプロジェクト
    ├── vite.config.ts
    ├── tsconfig.json
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   ├── lib/           # ベクトル化・ピース分割ロジック
    │   ├── pipeline/      # 段階別パイプライン
    │   └── ...
    ├── public/            # ローカル動作用静的アセット
    └── README.md          # 操作マニュアル
```

`utils/designValidator` / `types/design` 等の既存ロジックは相対パス import で再利用する(同リポなので可能)。

> **本体アプリのバンドルには含まれない** — `tools/` 配下は EAS Build / Expo Router 対象外として扱う(必要なら `metro.config.js` で除外設定)。

## 完成パターンの登録手順(手動)

ツール出力後のリポジトリ反映手順(README.md にも記載):

1. Web ツールから JSON ファイルをダウンロード
2. `constants/designs/<id>.json` に配置
3. サムネイル PNG を `assets/designs/<id>.png` に配置
4. `constants/designs/index.ts` の `RAW_DESIGN_FILES` 配列に import を追加
5. ローカルで `npx expo start` で表示確認
6. コミット → push → PR

> Phase 3 で CLI 補助スクリプトによる 2〜4 の自動化を検討。

## メモ / 制約

- **パターン形状は閉じた多角形である必要がある**(`designValidator` の制約)
- **ピース重複・はみ出し・隙間は禁止**(同上)
- **入力画像は線画として認識可能な品質が必要** — 極端にぼやけた画像や濃淡が均一でない画像は精度が出ない可能性
- **メタ情報は自動推定不可** — `name` / `nameJa` / `category` / `gridSize` は必ず開発者入力
- **既存サムネイル PNG が未配置** — 現状 `assets/designs/` は空。本タスクでサムネイル生成も含める
- **ツール自体のテスト**: ベクトル化 / ピース分割ロジックは Jest でユニットテスト(本体と同じテスト基盤を使う)
- **書籍の著作権**: パターン JSON 自体は座標データなので著作物性が低い見込みだが、書籍掲載のオリジナリティが高いパターン名・配色は本タスクでは扱わない

## 関連

- `constants/designs/` 配下の既存 JSON が出力フォーマットの基準
- `types/design.ts` / `utils/designValidator.ts` を import して再利用
- CLAUDE.md「パターンの JSON 定義」セクションが仕様の真
- CLAUDE.md「未確定事項」の「ユーザーが独自のパターンや画像を追加登録できる機能の要否」とは独立(あちらはエンドユーザー向け、本タスクは開発者向け)
