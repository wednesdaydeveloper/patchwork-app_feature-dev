# Plan: 16個の新規デザインJSONをアプリに登録する

## 対象ファイル（未登録16件）

| JSONファイル | SVG thumbnail | design.id |
|---|---|---|
| alice.json | alice.svg | alice |
| arabama_bauty.json | arabama_bauty.svg | arabama_beauty |
| arabian-plaid.json | arabian-plaid.svg | arabian_plaid |
| dog.json | dog.svg | dog |
| eight_petal.json | eight_petal.svg | eight_petal |
| eight_point_star.json | eight_point_star.svg | eight_point_star |
| english-ivy.json | english-ivy.svg | english_ivy |
| evening_star.json | evening_star.svg | evening_star |
| ice_cream_corn.json | ice_cream_corn.svg | ice_cream_corn |
| inner_city.json | inner_city.svg | inner_city |
| l_patch.json | l_patch.svg | l_patch |
| sea _storm.json (ゼロ幅スペース含む) | sea_storm.svg | sea_storm |
| spool_of_thread.json | spool_of_thread.svg | spool_of_thread |
| strawberry_basket.json | strawberry_basket.svg | strawberry_basket |
| walking-triangle.json | walking-triangle.svg | walking_triangle |
| wind_fan.json | wind_fan.svg | wind_fan |

## 発見された問題点

1. **strawberry_basket.json**: `"id": ""` が空文字（スキーマ違反）→ `"id": "strawberry_basket"` に修正
2. **全16件**: `thumbnail` フィールドが欠落（スキーマ必須）→ 各JSONに追加
3. **全16件**: 対応SVGファイルが `assets/designs/` に存在しない → 生成が必要

## 技術メモ

### SVG座標変換
- JSON内のpath座標は正規化座標（0.0〜1.0）
- SVGは400×400px（viewBox="0 0 400 400"）
- 変換: 座標値 × 400
- A コマンド: rx, ry も ×400（フラグと回転角は変換不要）
- C/S/Q コマンド（ベジェ曲線）: 全座標 ×400

## 実装ステップ

### Step 1: generate-design-svgs.js スクリプト作成
`scripts/generate-design-svgs.js` を新規作成。

```javascript
const SCALE = 400;
const COLORS = [
  '#e8c4b8', '#f5f0e8', '#c4bde8', '#b8d4c4', '#e8dbb8',
  '#d4b8c4', '#b8c4d4', '#d4c4b8', '#c8e0d0', '#e0d4c8',
  '#c8c4e0', '#d4e0c8', '#e0c8d4', '#c4d4e0', '#e8e0c4',
  '#d0c8e8'
];

// scalePath(pathStr, 400): SVGコマンドの座標をスケーリング
// M, L, T: x y → x*400 y*400
// H: x → x*400
// V: y → y*400
// C, S, Q: 全座標 → *400
// A rx ry rot F F x y → rx*400 ry*400 rot F F x*400 y*400
// Z: 変換なし
```

### Step 2: スクリプトを実行して16個のSVGを生成
```bash
node scripts/generate-design-svgs.js
```

### Step 3: strawberry_basket.json の id を修正
`"id": ""` → `"id": "strawberry_basket"`

### Step 4: 全16個のJSONに thumbnail フィールドを追加
`"thumbnail": "<slug>.svg"` を各JSONに追加。

### Step 5: constants/designs/index.ts を更新
16件の import 追加と RAW_DESIGN_FILES 配列への追加。

### Step 6: 型チェック
```bash
npx tsc --noEmit
```

## リスク・注意事項
- `sea ​_storm.json` のファイル名にゼロ幅スペース(U+200B)が含まれる
- arc パスを持つデザイン（wind_fan, alice, arabama_bauty 等）は rx, ry の正確なスケーリングが必要
