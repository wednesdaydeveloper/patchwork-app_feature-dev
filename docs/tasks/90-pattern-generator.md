# #90 パターン生成ツール: 画像から SVG path JSON を半自動生成

- **ステータス**: `[~]` 進行中（Phase 1・2 実装済み、Phase 3 一部実装済み）
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
      ↓ 参照画像として読み込み（D&D）
        - ズーム・パン対応でトレース補助
[2] ピース形状の作成（2 通り）
      ↓ グリッド自動生成
        - 列数・行数を指定してグリッドピースを一括生成
      ↓ 手描きモード（インタラクティブ）
        - クリックで頂点追加 → パスを閉じる
        - 辺ごとに直線(L) / 2次ベジェ(Q) / 3次ベジェ(C) / 円弧(A) を切替
        - ベジェ曲線: 制御点をドラッグで調整（スナップグリッドに縛られない）
        - 円弧: sagitta スライダーで膨らみを調整
[3] ピース候補(SVG path 群)
      ↓ GUI レビュー(手動)
        - 各ピースに id / label を割り当て
        - 不要なピースを削除
        - メタ情報入力(name, nameJa, category, gridSize)
        - 既存 utils/designValidator で検証
[4] JSON + サムネイル PNG をダウンロード
[5] CLI スクリプトでリポジトリへ自動配置
   (constants/designs/ + assets/designs/ + index.ts 更新)
```

## 受け入れ条件 (AC)

### Phase 1: グリッド系パターン MVP

- [x] `tools/pattern-generator/` に Vite + React の Web ツールを配置
- [x] 画像を D&D で取り込める
- [x] ~~画像を 2 値化・細線化 → ベクトル化して SVG path 候補を生成~~ → **方針変更**: 手描きモードで代替（Phase 2 で実装済み）
- [x] グリッド系(2×2, 3×3, 4×4, 5×5)のピース分割を自動提案
- [x] GUI でピース境界を確認・微調整(クリック選択、各ピースに id/label を割り当て)
- [x] メタ情報入力フォーム: `id`, `name`, `nameJa`, `category`, `gridSize`, `thumbnail`
- [x] 既存 `utils/designValidator` で出力 JSON を検証(再利用)
- [x] **JSON ファイル + サムネイル PNG ダウンロード**(手動配置方式)
- [x] `tools/pattern-generator/README.md` に操作マニュアル
- [ ] Phase 1 で直線多角形パターンを **20〜50 件** 実用的に作成可能（ツール完成・パターン量産は作業中）

### Phase 2: 曲線パターン対応

- [x] 円・円弧を SVG path data として出力（`A` コマンド対応）
- [x] 手描きモード: SVG キャンバス上でクリックして頂点を追加、最初の頂点をクリックして閉じる
- [x] セグメント切替: 各辺を直線 (L) / 2次ベジェ (Q) / 3次ベジェ (C) / 円弧 (A) でサイクル切替（L→Q→C→A→L）
- [x] 2次ベジェ（Q）: 制御点 1個をキャンバスでドラッグ調整
- [x] 3次ベジェ（C）: 制御点 2個をキャンバスでドラッグ調整（Q→C は次数昇格で形状保持）
- [x] ベジェ制御点はスナップグリッドに縛られず自由配置可能
- [x] 円弧の「膨らみ量」スライダー（符号付き sagitta）でリアルタイムに形状を調整
- [x] スナップグリッド（1/4, 1/6, 1/8, 1/10, 1/12）で頂点位置を整列
- [x] 手描きピースを既存ピース一覧に追加 → 既存の ID/ラベル編集・検証フローを再利用
- [x] ピース一覧から個別削除（✕ ボタン）
- [x] 参照画像のズーム（ホイール）・パン（ドラッグ）操作
- [x] 正の sagitta の円弧が描画されないバグを修正（SVG `sweepFlag` の誤スケーリング）
- [ ] 曲線パターンを **30〜100 件** 追加作成可能（ツール完成・パターン量産は作業中）

### Phase 3: 完全自動化向上

- [ ] グリッドパターンは画像投入だけで JSON 自動生成(高精度)（複雑な画像処理パイプラインが必要・今後検討）
- [ ] 認識精度の改善(角度補正、ノイズ除去、傾き補正)（上記に依存）
- [ ] バッチ処理(複数画像をまとめて変換)（今後検討）
- [x] CLI 補助スクリプト `npm run register` で生成 JSON → リポジトリ自動配置（`scripts/register.mjs`）

## 技術選択

| 項目 | 採用 | 備考 |
|---|---|---|
| GUI フレームワーク | Vite + React + TypeScript | 既存リポジトリと TS / 型を共有 |
| 検証 | `utils/designValidator`(既存) | 本体と同じスキーマで検証 |
| 画像処理 | Canvas API | サムネイル生成 |
| ベクトル化 | 手描きモードで代替 | imagetracer.js 等は不採用（手描きの方が精度が高い） |

## ディレクトリ配置

```text
tools/
└── pattern-generator/
    ├── package.json          # Vite + React サブプロジェクト
    ├── vite.config.ts
    ├── tsconfig.json
    ├── README.md             # 操作マニュアル
    ├── scripts/
    │   └── register.mjs     # リポジトリへの自動配置スクリプト
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── DrawingCanvas.tsx    # 手描きキャンバス（Phase 2）
        │   ├── ImageDropzone.tsx    # 参照画像 D&D
        │   ├── MetadataForm.tsx     # デザイン情報入力
        │   ├── PatternCanvas.tsx    # ピース一覧表示・選択
        │   ├── PieceList.tsx        # ピース一覧テーブル
        │   ├── SegmentPanel.tsx     # 手描きセグメント制御（Phase 2）
        │   └── ValidationPanel.tsx  # 検証結果表示
        ├── lib/
        │   ├── gridGenerator.ts     # グリッドピース自動生成
        │   ├── pathBuilder.ts       # SVG path 生成・スケーリング
        │   └── thumbnailGenerator.ts# サムネイル PNG 生成
        └── types.ts
```

## 完成パターンの登録手順

### CLI スクリプト（推奨）

```bash
cd tools/pattern-generator
npm run register -- ~/Downloads/nine-patch.json ~/Downloads/nine-patch.png --commit
```

### 手動

1. Web ツールから JSON / PNG をダウンロード
2. `constants/designs/<id>.json` に配置
3. サムネイル PNG を `assets/designs/<id>.png` に配置
4. `constants/designs/index.ts` の `RAW_DESIGN_FILES` 配列に import を追加
5. ローカルで `npx expo start` で表示確認
6. コミット → push → PR

## メモ / 制約

- **パターン形状は閉じた path(`Z` 終端)である必要がある**(`types/design.ts` / パターン JSON 仕様の要件)
- **ピース重複・はみ出し・隙間は禁止**(同上)
- **メタ情報は自動推定不可** — `name` / `nameJa` / `category` / `gridSize` は必ず開発者入力
- **ベクトル化パイプラインは不採用** — imagetracer.js / potrace.js による自動化より手描きモードの方が精度・使い勝手が良かったため
- **書籍の著作権**: パターン JSON 自体は座標データなので著作物性が低い見込みだが、書籍掲載のオリジナリティが高いパターン名・配色は本タスクでは扱わない

## 関連

- `constants/designs/` 配下の既存 JSON が出力フォーマットの基準
- `types/design.ts` / `utils/designValidator.ts` を import して再利用
- CLAUDE.md「パターンの JSON 定義」セクションが仕様の真
- CLAUDE.md「未確定事項」の「ユーザーが独自のパターンや画像を追加登録できる機能の要否」とは独立(あちらはエンドユーザー向け、本タスクは開発者向け)
