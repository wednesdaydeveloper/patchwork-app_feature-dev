# Pattern Generator

パッチワーク パターン JSON を生成する **開発者向け Web ツール**。  
`constants/designs/*.json` に追加するためのパターンを効率的に作成できます。

## セットアップ

```bash
cd tools/pattern-generator
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

---

## 使い方

### Step 1: 参照画像（任意）

パッチワーク書籍のスキャン画像を D&D またはクリックでアップロードします。  
キャンバスに半透明で表示され、ピース形状の確認・トレースに使えます。

- **ホイールスクロール**: カーソル位置を中心に拡大縮小
- **背景ドラッグ**: 参照画像をパン移動
- 右下の **＋ / ー / ↺** ボタンで倍率調整・リセット

---

### Step 2-A: グリッド生成（直線多角形パターン）

**列数 (cols)** と **行数 (rows)** を指定して **「グリッドを生成」** をクリックします。

| よくある組み合わせ | 用途例 |
|---|---|
| 2 × 2 | Four Patch |
| 3 × 3 | Nine Patch |
| 4 × 4 | Sixteen Patch |
| 2 × 4 / 4 × 2 | Log Cabin 系の矩形分割 |
| 1 × N | ストライプ系 |

---

### Step 2-B: 手描きモード（曲線パターン）

「**✏️ 手描きモードを開始**」をクリックすると手描きキャンバスに切り替わります。

#### 基本操作

1. キャンバスをクリックして頂点を追加
2. 3 頂点以上で**最初の頂点（青丸）をクリック**してパスを閉じる
3. 閉じた後、各辺の **○ マーク**をクリックしてセグメント種類を切替（**L → Q → C → A** の順にサイクル）
4. セグメント種類ごとの調整方法:
   - **L（直線）**: 調整なし
   - **Q（2次ベジェ）**: キャンバスに表示される**緑の制御点**をドラッグして曲線を調整
   - **C（3次ベジェ）**: キャンバスに表示される**紫の制御点 2個**をドラッグして曲線を調整
   - **A（円弧）**: 「**膨らみ量**」スライダーで形状を調整（負 = 左膨らみ、正 = 右膨らみ）
5. 「**✔ ピースを追加**」で確定 → 次のピースに進む
6. 全ピースが揃ったら「**キャンセル**」で手描きモードを終了

> **ベジェ制御点はスナップグリッドに縛られません。** 頂点はグリッドに吸着しますが、制御点は自由に配置できます。

#### スナップグリッド

スナップ設定（1/4, 1/6, 1/8, 1/10, 1/12）で**頂点**位置を格子点に自動吸着できます。

#### よく使うパターンの例

| パターン | 構成 |
|---|---|
| Drunkard's Path | 2 頂点の扇形 + 1 辺を円弧 A（凸） |
| Orange Peel | 4 頂点の正方形 + 対向 2 辺を円弧 A |
| Fan blade | 扇形（1 辺を大きな円弧 A に） |
| Flying Geese | 三角形 × 3 の組み合わせ |
| 花びら / ペタル | 4 頂点の菱形 + 2辺を 2次ベジェ Q（対称な曲線） |
| S字カーブ | 2辺を 3次ベジェ C（S 字反転曲線） |

---

### Step 3: ピース編集

- キャンバスでピースをクリックするか、左パネルの一覧行をクリックして選択
- 各ピースの **ID** と **Label（翻訳キー）** をインラインで編集
- 不要なピースは **✕ ボタン** で削除

#### ID の命名規則

```
p00  (列 0、行 0)
p10  (列 1、行 0)
center
topLeft
```

#### Label の命名規則

Label はアプリ内で `t('piece.<label>')` として解決される翻訳キーです。  
既存のキー（`locales/ja.ts` の `piece` セクション）を参照してください。

| キー | 日本語 |
|---|---|
| `topLeft` | 左上 |
| `topCenter` | 中上 |
| `topRight` | 右上 |
| `middleLeft` | 左中 |
| `center` | 中央 |
| `middleRight` | 右中 |
| `bottomLeft` | 左下 |
| `bottomCenter` | 中下 |
| `bottomRight` | 右下 |

新規ラベルを追加した場合は `locales/ja.ts` と `locales/en.ts` の `piece` セクションにも追記してください。

---

### Step 4: デザイン情報の入力

| フィールド | 説明 | 例 |
|---|---|---|
| ID | JSON ファイル名と一致させる（kebab-case 推奨） | `nine-patch` |
| Name | 英語パターン名 | `Nine Patch` |
| NameJa | 日本語パターン名 | `ナインパッチ` |
| Category | 翻訳キー | `threeGrid` |
| Grid Size | 正方形グリッドの分割数（自由形状は空欄） | `3` |
| Thumbnail | PNG ファイル名 | `nine-patch.png` |

#### カテゴリキー一覧

| キー | 表示名（日） |
|---|---|
| `twoGrid` | 2 グリッド |
| `threeGrid` | 3 グリッド |
| `fourGrid` | 4 グリッド |
| `fiveGrid` | 5 グリッド |
| `curved` | 曲線パターン |
| `freeform` | 自由形状 |

新規カテゴリを追加した場合は `locales/ja.ts` と `locales/en.ts` の `category` セクションにも追記してください。

---

### Step 5: 検証

**「🔍 検証する」** ボタンで幾何整合性を確認します。

- ✅ 検証通過 → ダウンロード可
- ❌ エラー → エラー内容を確認して修正

検証は `utils/designValidator.ts`（本体アプリと同じロジック）で行います。

---

### Step 6: ダウンロード

| ボタン | 出力 |
|---|---|
| **⬇ JSON をダウンロード** | `<id>.json` — パターン定義 |
| **🖼 サムネイル PNG をダウンロード** | `<thumbnailFilename>` — 色付きサムネイル |

---

## リポジトリへの配置手順

### 方法 A: CLI スクリプト（推奨）

```bash
# JSON のみ（単体）
npm run register -- path/to/design.json

# JSON + PNG（単体）
npm run register -- path/to/design.json path/to/thumbnail.png

# 配置してそのままコミット
npm run register -- path/to/design.json path/to/thumbnail.png --commit

# 複数 JSON をスペース区切りで指定（同名 .png を自動ペアリング）
npm run register -- a.json b.json c.json --commit

# ディレクトリ内の全 JSON を一括登録（同名 .png を自動ペアリング）
npm run register -- --dir ~/Downloads/patterns/ --commit
```

スクリプトが以下を自動で行います:
1. `constants/designs/<id>.json` にコピー
2. `assets/designs/<thumbnail>` にコピー（単体は PNG 指定時 / バッチは同名 PNG 自動ペアリング時）
3. `constants/designs/index.ts` に import と配列エントリを追加
4. `--commit` 指定時: `git add` + `git commit`（バッチ時は全件まとめて 1 コミット）

### 方法 B: 手動配置

1. JSON → `constants/designs/<id>.json` に配置
2. PNG → `assets/designs/<id>.png` に配置
3. `constants/designs/index.ts` の `RAW_DESIGN_FILES` に import を追加:
   ```ts
   import myPatternJson from '@/constants/designs/<id>.json';
   // ...
   const RAW_DESIGN_FILES: unknown[] = [..., myPatternJson];
   ```
4. `npx expo start` で表示確認
5. コミット → push → PR

---

## JSON フォーマット

出力される JSON は以下の形式です（`CLAUDE.md` の「パターンの JSON 定義」仕様に準拠）:

```json
{
  "version": "1.0",
  "design": {
    "id": "nine-patch",
    "name": "Nine Patch",
    "nameJa": "ナインパッチ",
    "category": "threeGrid",
    "gridSize": 3,
    "thumbnail": "nine-patch.png",
    "polygons": [
      {
        "id": "p00",
        "label": "topLeft",
        "path": "M 0 0 L 0.333 0 L 0.333 0.333 L 0 0.333 Z"
      }
    ]
  }
}
```

---

## 技術スタック

| 項目 | 採用 |
|---|---|
| フレームワーク | Vite + React + TypeScript |
| バリデーション | `utils/designValidator.ts`（本体と共有） |
| 型定義 | `types/design.ts`（本体と共有） |
| 画像処理 | Canvas API（サムネイル生成） |

詳細は `docs/tasks/90-pattern-generator.md` を参照。
