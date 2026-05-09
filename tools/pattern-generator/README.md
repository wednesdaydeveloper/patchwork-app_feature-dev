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

## 使い方

### Step 1: 参照画像（任意）

パッチワーク書籍のスキャン画像を D&D またはクリックでアップロードします。
キャンバスに半透明で表示され、グリッドの確認に使えます。

### Step 2: グリッド設定

**列数 (cols)** と **行数 (rows)** を指定して **「グリッドを生成」** をクリックします。

| よくある組み合わせ | 用途例 |
|---|---|
| 2 × 2 | Four Patch |
| 3 × 3 | Nine Patch |
| 4 × 4 | Sixteen Patch |
| 2 × 4 / 4 × 2 | Log Cabin 系の矩形分割 |
| 1 × N | ストライプ系 |

### Step 3: ピース編集

キャンバスでピースをクリックするか、左パネルの一覧行をクリックして選択します。  
各ピースの **ID** と **Label（翻訳キー）** をインラインで編集できます。

#### ID の命名規則

```
p00  (列 0、行 0)
p10  (列 1、行 0)
center
topLeft
```

#### Label の命名規則

Label はアプリ内で `t('piece.<label>')` として解決される翻訳キーです。  
既存のキー（`locales/ja.ts` の `piece` セクション）を参照してください:

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
| `freeform` | 自由形状 |

新規カテゴリを追加した場合は `locales/ja.ts` と `locales/en.ts` の `category` セクションにも追記してください。

### Step 5: 検証

**「🔍 検証する」** ボタンで幾何整合性を確認します。

- ✅ 検証通過 → ダウンロード可
- ❌ エラー → エラー内容を確認して修正

検証は `utils/designValidator.ts`（本体アプリと同じロジック）で行います。

### Step 6: ダウンロード

| ボタン | 出力 |
|---|---|
| **⬇ JSON をダウンロード** | `<id>.json` — パターン定義 |
| **🖼 サムネイル PNG をダウンロード** | `<thumbnailFilename>` — 色付きサムネイル |

## リポジトリへの配置手順

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

## 技術スタック

| 項目 | 採用 |
|---|---|
| フレームワーク | Vite + React + TypeScript |
| バリデーション | `utils/designValidator.ts`（本体と共有） |
| 型定義 | `types/design.ts`（本体と共有） |
| 画像処理 | Canvas API（サムネイル生成） |

## Phase 2 以降の予定

- 曲線パターン（円弧・ベジェ）対応
- セル結合によるカスタムグリッド形状
- 画像ベクトル化パイプライン（imagetracer.js）

詳細は `docs/tasks/90-pattern-generator.md` を参照。
