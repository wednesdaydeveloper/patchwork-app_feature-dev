# パッチワーク作成アプリ 要件定義

## プロジェクト概要

パッチワークのパターンと布地画像を組み合わせて、デジタルパッチワーク作品を作成・管理するモバイルアプリケーション。

- **対象ユーザー**: 趣味でパッチワークを楽しむ一般ユーザー
- **プラットフォーム**: iOS / Android（クロスプラットフォーム）
- **フレームワーク**: Expo（React Native）

---

## 技術スタック

| カテゴリ | 採用技術 | 備考 |
|----------|----------|------|
| フレームワーク | Expo（React Native） | iOS / Android 両対応 |
| 言語 | TypeScript | |
| 状態管理 | Jotai（atom） | グローバル状態を atom 単位で管理 |
| ナビゲーション | Expo Router | ファイルベースルーティング |
| 描画・キャンバス | react-native-svg | ピースの描画に使用 |
| ジェスチャー | react-native-gesture-handler | ピンチ操作（移動・拡大縮小） |
| アニメーション | react-native-reanimated | スムーズな UI 更新 |
| 永続化ストレージ | expo-sqlite | パッチワークデータ・布地画像メタデータの保存 |
| 画像取得 | expo-image-picker | カメラ撮影・カメラロール選択 |
| ファイル保存 | expo-file-system | 布地画像のローカル保存（File / Directory / Paths API） |
| 多言語化 | i18next + react-i18next | UI 文言の翻訳 |
| ロケール検出 | expo-localization | 端末ロケールの取得 |
| 画像エクスポート | react-native-view-shot | キャンバスを画像として出力 |
| 印刷出力 | expo-print | PDF 生成 |

### 状態管理方針（Jotai）

- 状態は小さな **atom** 単位に分割して定義する
- グローバルに共有が必要な状態のみ atom で管理し、ローカルな状態は `useState` を使う
- 主な atom 例：

```typescript
// 選択中のパターン
const selectedDesignAtom = atom<Design | null>(null)

// パッチワーク編集中のピース設定一覧
const pieceSettingsAtom = atom<PieceSetting[]>([])

// 選択中のピースID
const selectedPolygonIdAtom = atom<string | null>(null)
```

### 開発コマンド

```bash
# 開発サーバー起動
npx expo start

# iOS シミュレーターで起動
npx expo start --ios

# Android エミュレーターで起動
npx expo start --android

# 型チェック
npx tsc --noEmit

# ビルド（EAS Build）
eas build --platform all
```

### ディレクトリ構成（方針）

```
app/                  # Expo Router の画面ファイル
├── index.tsx         # ホーム画面
├── design-select.tsx # パターン選択画面
├── editor/[id].tsx   # パッチワーク作成・編集画面
├── export/[id].tsx   # エクスポート画面
├── fabrics/index.tsx # 布地管理画面
└── settings.tsx      # 設定画面（言語切替）
components/           # 再利用可能なコンポーネント
├── canvas/           # キャンバス・ピース描画
├── fabric/           # 布地画像選択パネル
└── ui/               # 汎用UIコンポーネント
atoms/                # Jotai の atom 定義
hooks/                # カスタムフック
constants/            # 初期データ（パターン定義 等）
locales/              # 翻訳定義（ja.ts / en.ts）
types/                # 型定義
utils/                # ユーティリティ関数（i18n / db / 画像出力 等）
```

---

## 用語定義

| 用語 | 定義 |
|------|------|
| ピース | 直線、円、円弧、ベジェ曲線で構成された閉じた図形のこと。<br>ピースを構成する線は、交差してはいけない。|
| パターン | 矩形。<br/>1つ以上のピースを組み合わせたパッチワークの型紙テンプレート。<br>ピースを隙間なく並べたもの。<br>矩形。<br>矩形内で、ピースが重なってはいけない。<br>また、矩形からピースがはみ出してはいけない。<br/>パターンには、それぞれ固有の名称を持つ。 |
| 画像 | 布地や柄を表す画像データ（あらかじめアプリに登録済み） |
| 対応づけ | ピースと画像を関連付ける操作 |
| パッチワーク | パターンに画像を対応づけして完成させたパッチワーク |


---

## 機能要件

### 1. マスターデータ管理

#### 1-1. パターン管理
- パターンはあらかじめアプリ内に登録されているものとする（初期データ）
- 各パターンは以下の情報を持つ
  - パターン名
  - サムネイル画像
  - ピースの集合（各ピースの頂点座標リスト）

#### 1-2. 画像（布地）管理
- 画像はユーザーが**スマホカメラまたはカメラロールから自由に登録・削除**できる
- 初期状態では画像は1つも登録されていない
- 画像が1つも登録されていない場合は、画像登録を促すメッセージを表示する
- 各画像は以下の情報を持つ
  - 画像名（ユーザー入力、省略時はデフォルト名）
  - 画像データ（PNG / JPEG、端末ローカルに保存）
  - カテゴリ（任意、ユーザー入力）
- 必要なパーミッション
  - カメラアクセス（`expo-camera` または `expo-image-picker`）
  - フォトライブラリアクセス（`expo-image-picker`）
- 画像ファイルは `expo-file-system` でアプリのドキュメントディレクトリに保存し、SQLite にメタデータ（id・名前・カテゴリ・ファイルパス）を保存する

---

### 2. パッチワーク作成機能

#### 2-1. パターン選択
- 登録済みパターンの一覧をグリッド表示する
- パターンのサムネイルをタップして選択し、パッチワーク作成画面へ遷移する

#### 2-2. ピースへの画像対応づけ
- パッチワーク作成画面ではパターンの全ピースを表示する
- ユーザーは任意のピースをタップして選択できる
- 選択したピースに対して、登録済み画像の中から1つを選択して対応づけできる
- 複数のピースに同じ画像を対応づけることができる
- 対応づけは個々のピースごとに独立して設定できる

#### 2-3. 画像の調整
対応づけた画像に対して以下の調整ができる：

| 操作 | 説明 |
|------|------|
| 位置調整 | ピース内での画像の表示位置を移動（ピンチ操作中の平行移動） |
| 拡大縮小 | 画像の表示倍率を調整（ピンチ操作） |

- 選択されたピースを調整する場合は「調整」ボタンを押す。
- 「調整」ボタンをタップすると、調整しやすいようにピースを大きく表示する。
- 調整はリアルタイムにプレビューへ反映される
- 調整値（位置・倍率）はピースごとに独立して保存される
- 調整のリセット機能（初期値に戻す）を提供する
- 調整が完了すると、「調整完了」ボタンを押し、を元の状態に戻る。

---

### 3. パッチワーク管理機能

#### 3-1. アプリ内保存・編集
- 作成途中および完成したパッチワークをアプリ内に保存できる
- 保存したパッチワークは一覧から再度開いて編集を続けられる
- パッチワークには任意の名前を付けられる
- パッチワークの削除ができる

#### 3-2. 画像エクスポート
- 完成したパッチワークを端末のカメラロール／フォトライブラリに画像として保存できる
- エクスポート形式：PNG（透明背景対応）または JPEG
- エクスポート解像度は高解像度（推奨：最低 1080px 以上の長辺）とする

#### 3-3. 印刷用データ出力
- 印刷に適した高解像度データ（PDF または高解像度 PNG）を出力できる
- 出力時に用紙サイズ（A4 など）を選択できる
- 実寸サイズでの印刷に対応するため、スケール情報を含む

---

## 非機能要件

### パフォーマンス
- パターン一覧・画像一覧のスクロールは 60fps を維持する
- 画像調整操作はリアルタイム（遅延 100ms 以内）でプレビューに反映する

### UI / UX
- 直感的なタッチ操作（タップ・ピンチ）で全操作を完結させる
- 操作の取り消し（Undo）・やり直し（Redo）に対応する
  - 保持件数：直近 **20 操作** まで
  - 対象操作：画像の対応づけ、位置調整、倍率調整、対応づけ解除
  - パッチワークを切り替えた場合は履歴をクリアする
- 初心者ユーザーが迷わないシンプルなインターフェース設計

### エラーハンドリング方針

| 発生箇所 | 挙動 |
|----------|------|
| パッチワークの保存失敗 | エラートーストを表示し、未保存状態を維持。リトライを促す |
| パッチワークの読み込み失敗 | エラーダイアログを表示し、ホーム画面に戻る |
| 画像エクスポート失敗 | エラートーストを表示し、再試行ボタンを提供 |
| 印刷データ生成失敗 | エラーダイアログを表示し、原因（メモリ不足等）を可能な限り提示 |
| ストレージ容量不足 | 事前検知して警告ダイアログを表示し、不要なパッチワークの削除を促す |
| パターンJSONパース失敗 | アプリ起動時に検知してエラー画面を表示（開発時のみ発生想定） |

- ユーザー操作によるエラーは**トースト通知**で軽く伝える
- システム的に致命的なエラーは**ダイアログ**で明示し、復帰手段を提示する
- すべてのエラーは内部ログに記録する（将来のクラッシュレポート連携を想定）

### 対応 OS バージョン
- iOS 15.1 以上
- Android 7（API Level 24）以上
- ※ Expo SDK の最新サポート範囲に準拠

### 多言語化
- 対応言語：**日本語 / 英語**
- 初期言語は端末ロケールから自動検出（`ja` → 日本語、それ以外 → 英語）
- 設定画面で「端末設定に従う」「日本語」「English」のいずれかを選択可能
- 選択は `atomWithStorage` 経由で AsyncStorage に永続化
- 翻訳定義は `locales/ja.ts` と `locales/en.ts`（`Translations` 型で同一スキーマを強制）
- パターン名はモデル側に `name` / `nameJa` を保持してロケールに応じて切替
- ピースラベル（`Polygon.label`）は翻訳キー（`piece.<key>`）として扱う
- 日付フォーマットは `utils/format.ts` でロケール別書式（`ja`: `yyyy/MM/dd`、`en`: `yyyy-MM-dd`）

---

## 画面構成

```
├── ホーム画面
│   ├── 新規パッチワーク作成ボタン
│   ├── 布地管理画面への導線
│   ├── 設定画面への導線
│   └── 保存済みパッチワーク一覧
├── パターン選択画面
│   └── パターン一覧（グリッド）
├── パッチワーク作成・編集画面（メイン）
│   ├── キャンバス（パターン表示エリア）
│   ├── ピース選択
│   ├── 画像選択パネル
│   └── 調整コントロール（位置・倍率）
├── エクスポート画面
│   ├── 画像保存
│   └── 印刷用データ出力
├── 布地管理画面
│   └── 登録済み布地一覧 + 登録／削除
└── 設定画面
    └── 言語切替（端末設定に従う / 日本語 / English）
```

---

## データモデル（概要）

```
Design（パターン）
├── id: String
├── name: String              // 英語名
├── nameJa: String            // 日本語名
├── category: String          // カテゴリ（例: "3グリッド", "4グリッド"）
├── gridSize: Number | null   // グリッド系の分割数。自由形状は null
├── thumbnail: ImagePath
└── polygons: List<Polygon>

Polygon（ピース）
├── id: String
├── label: String             // ピースのラベル（例: "中央", "左上"）
└── vertices: List<Point>     // 頂点座標リスト（正規化座標 0.0〜1.0）

FabricImage（布地画像、ユーザー登録）
├── id: String
├── name: String           // ユーザー入力名
├── category: String       // ユーザー入力カテゴリ（空文字可）
├── imagePath: ImagePath   // expo-file-system のドキュメントディレクトリ配下のパス
└── createdAt: DateTime

Work（パッチワーク）
├── id: String
├── name: String
├── designId: String
├── createdAt: DateTime
├── updatedAt: DateTime
└── pieceSettings: List<PieceSetting>

PieceSetting（ピース設定）
├── polygonId: String
├── fabricImageId: String
├── offsetX: Float       // 画像の位置 X（正規化座標、ピース中心からの相対オフセット）
├── offsetY: Float       // 画像の位置 Y（正規化座標、ピース中心からの相対オフセット）
└── scale: Float         // 表示倍率（1.0 = 等倍、初期値はピースに収まる最小倍率）
```

### 座標系の補足

- **パターン座標系**: ブロック全体を 1×1 の正方形として正規化（0.0〜1.0）
- **ピース内画像座標系**:
  - `offsetX`, `offsetY` はピースの中心を原点（0, 0）とした相対座標
  - 画像をピースにフィットさせた状態を `offsetX=0, offsetY=0, scale=1.0` の初期値とする
  - 実際の描画時は、パターン座標 → 端末ピクセル座標へスケール変換する

---

## パターンの JSON 定義

### 設計方針

- ブロック全体を **1×1 の正方形** として座標を正規化（0.0〜1.0）
- ピースの頂点を `[x, y]` の配列で表現
- 正規化座標を使うことで、画面サイズに依存せずどの端末でも同じ形で描画できる
- `react-native-svg` の `width` に合わせてスケールするだけで対応可能
- グリッド系パターン（Nine Patch など）は `gridSize` を持ち、自動生成も可能にする
- 自由形状（Star 系など）は `gridSize: null` で区別する

### ファイル構成

```
constants/
└── design001.json   # 定義ファイル
└── design002.json   # 定義ファイル
```

### JSON スキーマ

```json
{
  "version": "1.0",
  "design": {
    "id": "string",          // 一意なID
    "name": "string",        // パターン名（英語）
    "nameJa": "string",      // パターン名（日本語）
    "category": "string",    // カテゴリ（例: "3グリッド", "4グリッド"）
    "gridSize": 3,           // グリッド系は数値、自由形状は null
    "thumbnail": "string",   // サムネイル画像ファイル名
    "polygons": [
      {
        "id": "string",      // ピース一意ID（例: "p00", "center"）
        "label": "string",   // ピースのラベル（例: "左上", "中央"）
        "vertices": [        // 頂点座標リスト（正規化座標 0.0〜1.0）
          [0.0, 0.0],
          [0.5, 0.0],
          [0.5, 0.5],
          [0.0, 0.5]
        ]
      }
    ]
  }
}
```

### サンプル定義

#### Nine Patch（3×3 グリッド）

```json
{
  "id": "nine-patch",
  "name": "Nine Patch",
  "nameJa": "ナインパッチ",
  "category": "3グリッド",
  "gridSize": 3,
  "thumbnail": "nine-patch.png",
  "polygons": [
    { "id": "p00", "label": "左上", "vertices": [[0.000,0.000],[0.333,0.000],[0.333,0.333],[0.000,0.333]] },
    { "id": "p10", "label": "中上", "vertices": [[0.333,0.000],[0.667,0.000],[0.667,0.333],[0.333,0.333]] },
    { "id": "p20", "label": "右上", "vertices": [[0.667,0.000],[1.000,0.000],[1.000,0.333],[0.667,0.333]] },
    { "id": "p01", "label": "左中", "vertices": [[0.000,0.333],[0.333,0.333],[0.333,0.667],[0.000,0.667]] },
    { "id": "p11", "label": "中央", "vertices": [[0.333,0.333],[0.667,0.333],[0.667,0.667],[0.333,0.667]] },
    { "id": "p21", "label": "右中", "vertices": [[0.667,0.333],[1.000,0.333],[1.000,0.667],[0.667,0.667]] },
    { "id": "p02", "label": "左下", "vertices": [[0.000,0.667],[0.333,0.667],[0.333,1.000],[0.000,1.000]] },
    { "id": "p12", "label": "中下", "vertices": [[0.333,0.667],[0.667,0.667],[0.667,1.000],[0.333,1.000]] },
    { "id": "p22", "label": "右下", "vertices": [[0.667,0.667],[1.000,0.667],[1.000,1.000],[0.667,1.000]] }
  ]
}
```

#### Variable Star（三角形・四角形の混在）

```json
{
  "id": "variable-star",
  "name": "Variable Star",
  "nameJa": "バリアブルスター",
  "category": "3グリッド",
  "gridSize": null,
  "thumbnail": "variable-star.png",
  "polygons": [
    { "id": "center",    "label": "中央",   "vertices": [[0.25,0.25],[0.75,0.25],[0.75,0.75],[0.25,0.75]] },
    { "id": "top",       "label": "上三角", "vertices": [[0.25,0.00],[0.75,0.00],[0.50,0.25]] },
    { "id": "bottom",    "label": "下三角", "vertices": [[0.25,1.00],[0.50,0.75],[0.75,1.00]] },
    { "id": "left",      "label": "左三角", "vertices": [[0.00,0.25],[0.25,0.50],[0.00,0.75]] },
    { "id": "right",     "label": "右三角", "vertices": [[1.00,0.25],[0.75,0.50],[1.00,0.75]] },
    { "id": "corner-tl", "label": "左上角", "vertices": [[0.00,0.00],[0.25,0.00],[0.00,0.25]] },
    { "id": "corner-tr", "label": "右上角", "vertices": [[0.75,0.00],[1.00,0.00],[1.00,0.25]] },
    { "id": "corner-bl", "label": "左下角", "vertices": [[0.00,0.75],[0.25,1.00],[0.00,1.00]] },
    { "id": "corner-br", "label": "右下角", "vertices": [[0.75,1.00],[1.00,0.75],[1.00,1.00]] }
  ]
}
```

### TypeScript 型定義

```typescript
// types/design.ts

export type Point = [number, number]; // [x, y] 正規化座標 (0.0〜1.0)

export interface Polygon {
  id: string;
  label: string;
  vertices: Point[];
}

export interface Design {
  id: string;
  name: string;
  nameJa: string;
  category: string;
  gridSize: number | null;
  thumbnail: string;
  polygons: Polygon[];
}

export interface DesignFile {
  version: string;
  designs: Design[];
}
```

---

## ベストプラクティス

### React / TypeScript

#### 関数コンポーネント・Hooks
- **関数コンポーネントのみを使う**（クラスコンポーネントは使わない）
- コンポーネントは `function` 宣言ではなく `const Component = () => {}` の形式で統一
- カスタムフックは `useXxx` の命名規則に従う
- `useEffect` は依存配列を必ず明示し、ESLint の `react-hooks/exhaustive-deps` ルールを有効にする
- 副作用が複雑な場合は、まずカスタムフックへ切り出すことを検討する

#### TypeScript
- `tsconfig.json` で **`strict: true`** を有効にする
- `any` の使用を禁止する（やむを得ない場合は `// eslint-disable-next-line` でコメント必須）
- Props 型は `interface` で定義し、コンポーネントと同じファイル内に配置
- 共有される型は `types/` 配下に配置
- パスエイリアス（`@/components/...` 形式）を使い、相対パスの深いネストを避ける

```typescript
// ✅ 推奨
interface ButtonProps {
  label: string;
  onPress: () => void;
}

const Button = ({ label, onPress }: ButtonProps) => { ... };

// ❌ 非推奨
const Button = (props: any) => { ... };
```

#### コンポーネント設計
- **1コンポーネント1ファイル**を原則とする
- ファイル名はコンポーネント名と一致させる（PascalCase）
- 200行を超えたコンポーネントは分割を検討する
- ビジネスロジックは UI コンポーネントから切り離す（カスタムフック化）
- スタイルは `StyleSheet.create()` を使い、コンポーネントと同じファイル末尾に定義

#### パフォーマンス
- リスト描画は **`FlatList`** を使う（`map` で大量描画しない）
- 子コンポーネントへ関数を渡す場合は `useCallback` を検討
- 計算コストの高い値は `useMemo` を使う
- 不要な再レンダリングを避けるため `React.memo` を適切に使う
- ただし、過剰なメモ化は逆効果なので**プロファイラで計測してから**最適化する

---

### Expo / React Native

#### プロジェクト初期化
```bash
# TypeScript テンプレートで作成
npx create-expo-app@latest --template blank-typescript
```

#### ファイル拡張子
- React コンポーネント（JSX を含む）：**`.tsx`**
- 純粋なロジック・型定義：**`.ts`**

#### Expo Router
- ファイルベースルーティングを使う（`app/` ディレクトリ）
- 動的ルートは `[id].tsx` の形式
- 共通レイアウトは `_layout.tsx` で定義
- ルートファイルは**画面の薄いラッパー**にとどめ、実装は `features/` または `screens/` から import する

```typescript
// app/editor/[id].tsx（薄いルートファイル）
export { EditorScreen as default } from '@/features/editor/EditorScreen';
```

#### 画像・アセット
- 画像は `assets/images/` に配置
- 動的に読み込まない静的画像は **`require()`** で import する（`expo-asset` でプリロード）
- 画像は事前に最適化する（PNG → WebP、サイズ縮小）

#### ジェスチャー
- `react-native-gesture-handler` の **`GestureDetector`**（v2 API）を使う
- ピンチ操作は `Gesture.Pinch()` と `Gesture.Pan()` を `Gesture.Simultaneous()` で組み合わせる
- ジェスチャーの状態は `useSharedValue`（reanimated）で保持し、UIスレッドで処理する

#### パフォーマンス
- 描画コストの高い操作は `react-native-reanimated` の **`useSharedValue`** と **`useAnimatedStyle`** を使い、UIスレッドで処理する
- `react-native-svg` のピースは再描画を最小化するため `React.memo` で包む
- 開発時は **Performance Monitor** を有効にしてフレームレートを常時確認する

---

### Jotai（状態管理）

#### atom の粒度
- atom は**小さく分割する**（オブジェクト全体を1つの atom にしない）
- 1 atom = 1 つの関心事を原則とする
- 頻繁に更新される atom と滅多に更新されない atom を分ける

```typescript
// ✅ 推奨：細かく分ける
const selectedDesignAtom = atom<Design | null>(null);
const selectedPolygonIdAtom = atom<string | null>(null);
const pieceSettingsAtom = atom<PieceSetting[]>([]);

// ❌ 非推奨：1つの atom に詰め込む
const editorStateAtom = atom({
  selectedDesign: null,
  selectedPolygonId: null,
  pieceSettings: [],
  // ... すべてのプロパティが変わるたびに全コンポーネントが再描画
});
```

#### 命名規則
- atom 変数は **`xxxAtom`** のサフィックスを付ける
- 派生 atom（derived atom）も同じ命名規則に従う
- `debugLabel` を設定してデバッグしやすくする

```typescript
const selectedDesignAtom = atom<Design | null>(null);
selectedDesignAtom.debugLabel = 'selectedDesign';
```

#### Hooks の使い分け
| Hook | 用途 |
|------|------|
| `useAtom` | 値の読み書き両方を行う場合 |
| `useAtomValue` | 値の読み取りのみ（再レンダリング最適化） |
| `useSetAtom` | 値の書き込みのみ（再レンダリング回避） |

```typescript
// ✅ 書き込みだけのコンポーネントでは useSetAtom を使う
const setSelectedPolygon = useSetAtom(selectedPolygonIdAtom);

// ❌ これだと値が変わるたびに再レンダリングされる
const [, setSelectedPolygon] = useAtom(selectedPolygonIdAtom);
```

#### 派生 atom（derived atom）
- 計算結果は派生 atom に閉じ込める
- コンポーネント内で計算するのではなく、atom レベルで派生させる

```typescript
// 選択中のピース設定を派生 atom で取得
const selectedPieceSettingAtom = atom((get) => {
  const polygonId = get(selectedPolygonIdAtom);
  const settings = get(pieceSettingsAtom);
  return settings.find((s) => s.polygonId === polygonId) ?? null;
});
```

#### 永続化
- 永続化したい atom は `atomWithStorage` を使う
- React Native では `AsyncStorage` をストレージとして指定する

```typescript
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = createJSONStorage(() => AsyncStorage);
const recentDesignsAtom = atomWithStorage('recent-designs', [], storage);
```

#### atom ファイルの構成
- atom は機能単位で `atoms/` 配下に分割
- 例：`atoms/editor.ts`、`atoms/works.ts`、`atoms/designs.ts`
- atom と関連する派生 atom・write-only atom は同じファイルに配置

---

### 多言語化（i18n）

#### ライブラリ
- **`i18next` + `react-i18next`** を使用
- 端末ロケール検出は **`expo-localization`** の `getLocales()`

#### ファイル構成
- `locales/ja.ts` を真とし、`Translations = typeof ja` の型を `locales/en.ts` に強制
- `utils/i18n.ts` で `i18next` を初期化（端末ロケール → `ja` か `en` のどちらかにマッピング）
- `atoms/settings.ts` の `languagePreferenceAtom` は `atomWithStorage` で AsyncStorage に永続化

#### 使い方
```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <Text>{t('home.newWork')}</Text>;
};
```

#### 翻訳キーの命名規則
- 画面名 / 機能名でネームスペースを区切る（`home.*`, `editor.*`, `fabrics.*` など）
- 共通 UI（OK / キャンセル）はそのスコープ内に閉じる（重複翻訳は許容）
- ピースラベル（`Polygon.label`）は **翻訳キー** として保持（例：`topLeft`、`center`）。表示時に `t('piece.<key>')` で解決
- パターン名は `Design.name`（英語）と `Design.nameJa`（日本語）をモデルに保持し、`useDesignName()` フックでロケールに応じて返す

#### 言語追加の手順
1. `locales/<lang>.ts` を `Translations` 型で作成
2. `utils/i18n.ts` の `resources` に追加
3. `detectSystemLanguage()` のマッピングを更新
4. `app/settings.tsx` の `options` に追加

---

### コード品質

#### ESLint / Prettier
- **ESLint** で静的解析、**Prettier** でフォーマット統一
- pre-commit フックで `lint` と `tsc --noEmit` を必ず実行する
- 推奨設定：
  - `eslint-config-expo`
  - `@trivago/prettier-plugin-sort-imports`（import の自動ソート）

#### コミット前チェック
```bash
npm run lint            # ESLint
npx tsc --noEmit        # 型チェック
npm run test            # （導入時）テスト実行
```

#### テスト
- 単体テスト：**Jest** + **React Native Testing Library**
- ロジック（atom の派生、ユーティリティ関数）から優先的にテストを書く
- UI コンポーネントはスナップショットテストではなく**動作テスト**を書く

---

### Claude Code との協業

- **CLAUDE.md（このファイル）はプロジェクトの単一の真実**として扱い、仕様変更時は必ず更新する
- 新しい機能を実装する前に、Claude Code に**実装計画を立てさせて確認**してから実装に進む
- 実装中に発見したパターンや制約は CLAUDE.md に追記して、将来の参照に残す
- 大きなリファクタリングは**段階的に進め**、各段階で動作確認する

- ユーザーが独自のパターンや画像を追加登録できる機能の要否
- クラウド同期・バックアップ機能の要否
- パッチワークのSNSシェア機能の要否
- パターン・画像の初期データ点数と更新方針（アプリアップデート vs サーバー配信）
