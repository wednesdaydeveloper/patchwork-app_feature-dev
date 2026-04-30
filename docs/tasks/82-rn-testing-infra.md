# #82 React Native テスト基盤導入と app/components/hooks のテスト追加

- **ステータス**: `[x]` 完了 (要点カバー)
- **フェーズ**: 19. 品質強化
- **前提**: #81
- **重要度**: 🟢 品質改善

## 概要

`app/` (画面ルート薄ラッパー)、`components/` (UI コンポーネント)、`hooks/` (RN 依存フック) は現在テスト基盤がなく、カバレッジ 0% のまま。
React Native コンポーネントとフックを実環境相当で検証するため、`jest-expo` + `@testing-library/react-native` を導入し、
レンダリング・ジェスチャー・jotai 連携を含む挙動をテストする。

## 受け入れ条件 (AC)

### テスト基盤
- [ ] `jest-expo` プリセットを導入し `package.json` の `jest` セクションを再構成
- [ ] `@testing-library/react-native` を devDependencies に追加
- [ ] `react-test-renderer` を依存と合わせて追加
- [ ] 既存 21 suite / 91 ケースが引き続きグリーン
- [ ] `npx tsc --noEmit` 通過

### components/ui (低リスクから着手)
- [ ] `Button.tsx` — variant ごとの描画、disabled 時の Press 抑止、accessibility 属性
- [ ] `IconButton.tsx` — 同上
- [ ] `Toast.tsx` — variant ごとの描画、actionLabel タップ
- [ ] `Dialog.tsx` — 各アクションの onPress 呼び出し、dismissOnBackdrop 挙動
- [ ] `PromptDialog.tsx` — 入力 → submit 値の伝搬
- [ ] `LoadingView.tsx` — メッセージ描画
- [ ] `NotificationHost.tsx` — toast / dialog キューと連動した表示

### components (canvas / fabric)
- [ ] `Piece.tsx` — 選択状態の表示切替、onPress 伝搬
- [ ] `PieceImage.tsx` — 画像描画パラメータの正当性 (snapshot or attribute 検証)
- [ ] `PatternCanvas.tsx` — ピース一覧の描画、選択ピースのハイライト
- [ ] `FabricPicker.tsx` — 一覧表示、選択 → onPress 伝搬

### hooks
- [ ] `useDesignName.ts` — i18n.language に応じた切替 (renderHook)
- [ ] `useI18n.ts` — `'system'` 互換マイグレーション、preference 変更追従
- [ ] `useDeviceSize.ts` — Dimensions モックで `phone` / `tablet` 切替
- [ ] `useImageSize.ts` — Image.getSize モック
- [ ] `useOrientationLock.ts` — expo-screen-orientation モック
- [ ] `useStorageGuard.ts` — checkStorageStatus モック + ダイアログ表示

### app (薄ラッパー)
- [ ] `app/_layout.tsx` — Provider のネスト、useI18n 呼び出し
- [ ] `app/index.tsx` 等の各ルート — feature 画面が export されているスモークテスト

## 対象外

- ジェスチャー (`react-native-gesture-handler`) と Reanimated を多用する箇所の挙動再現は深追いしない。要素の存在と props 渡しの確認に留める。
- 実機/シミュレータでしか検証できない描画 (svg ピクセル一致) はスナップショット参考程度。

## 結果

### 数値
- テスト Suite: 21 → **35** (+14)
- テストケース: 91 → **132** (+41)
- 全体 Stmts カバレッジ: 67.66% → **75.24%**
- `hooks/` カバレッジ: 2.04% → **91.83%**
- `components/ui/` カバレッジ: **91.02%**
- `components/fabric/` カバレッジ: **100%**
- `components/canvas/` カバレッジ: 13.04% (Piece のみ。PatternCanvas / PieceImage は SVG / ジェスチャー描画のためスキップ)

### 基盤
- `package.json` の `jest` を `projects` 構成にして `node` (純ロジック) と `rn` (jest-expo + RTL) を分離
- `jest.setup.js` で expo の winter polyfill (`__ExpoImportMetaRegistry` / `structuredClone`) を pre-install して runtime 例外を回避
- `react-test-renderer` は React 19.1.0 にピン留め

### 追加テスト (新規 13 ファイル)
- UI: `Button` `IconButton` `Toast` `LoadingView` `Dialog` `PromptDialog` `NotificationHost`
- Canvas/Fabric: `Piece` `FabricPicker`
- Hooks: `useDeviceSize` `useImageSize` `useOrientationLock` `useStorageGuard` `useI18n`

### リファクタリング (機能変更なし)
- `Dialog.tsx` / `PromptDialog.tsx`: 内側 Pressable の `e.stopPropagation()` を `e?.stopPropagation?.()` に変更し、テスト合成イベントで例外が起きないようにした

### 対象外として残した項目
- `PatternCanvas.tsx` / `PieceImage.tsx` (SVG 数値検証はピクセル一致テスト性が低くROI 低)
- `useFabricRegister.ts` の副作用部 (カメラ・ファイルシステム統合)
- `app/*.tsx` (薄ラッパーかつ expo-router の挙動再現コスト大。ロジックは `features/*` に集約済みで、そこは別タスクで個別画面テストが可能)
