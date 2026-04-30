# #81 テストカバレッジ拡充 (案A)

- **ステータス**: `[x]` 完了 (案A 範囲)
- **フェーズ**: 19. 品質強化
- **前提**: #43, #64
- **重要度**: 🟢 品質改善

## 概要

現状のテストカバレッジは Stmts 27.33% にとどまっており、ロジック層に未テストのファイルが多数残っている。
案A 方針で、純粋ロジック層 (テスト容易、効果大) と中粒度モック層 (i18n / storage / hooks 一部) にテストを追加し、80% に近づける。
ネイティブ依存が重い領域 (expo-sqlite / expo-file-system / カメラ統合 / svg-path-properties 統合) は対象外とする。
テストの障害となっている密結合コードは機能を維持したままリファクタリングする。

## 受け入れ条件 (AC)

- [x] `utils/designValidator.ts` のテストを追加
- [x] `features/export/buildPdfHtml.ts` のテストを追加
- [x] `utils/logger.ts` のテストを追加
- [x] `atoms/notification.ts` のテストを追加
- [x] `atoms/settings.ts` のテストを追加
- [x] `atoms/works.ts` のテストを追加 (`saveWork` などをモック)
- [x] `atoms/fabrics.ts` の未カバー分を補完
- [x] `utils/i18n.ts` のテストを追加 (`expo-localization` モック) — `detectSystemLanguage` / `resolveLanguage` / `initI18n` / `changeLanguage` 全て
- [x] `utils/storage.ts` のテストを追加 (`fileSystem` モック)
- [x] `hooks/useDesignName.ts` の純粋関数 `getDesignName` を抽出してテストを追加
- [x] `features/editor/useSampledPolygons.ts` の純粋関数 `sampleDesignPolygons` を抽出してテストを追加
- [x] `features/fabrics/useFabricRegister.ts` の純粋ヘルパー (`generateFabricId` / `defaultFabricName` / `resolveFabricMeta`) を別ファイル `fabricRegisterHelpers.ts` に切り出してテストを追加
- [x] `utils/path.ts` の未カバー分岐を補完 (`samplePath` 空 path / `computeBbox` 空配列 / `isPointInPolygon` 頂点不足 / `isPointInPath`)
- [x] テストしやすさのためのリファクタリングは機能を変更しない (=回帰なし、既存テストグリーン)
- [x] 既存テスト + 新規テストすべてグリーン
- [x] `npx tsc --noEmit` 通過

## 対象外 (案A 方針)

- `utils/db.ts` (expo-sqlite モック量大)
- `utils/fileSystem.ts` (expo-file-system モック量大)
- `hooks/useStorageGuard.ts` / `useImageSize.ts` / `useOrientationLock.ts` / `useDeviceSize.ts`
- `features/fabrics/useFabricRegister.ts` (カメラ・FS 統合)
- `features/editor/useSampledPolygons.ts` (svg-path-properties 統合)
- 画面コンポーネント (`features/*/*.tsx`)

これらは ROI が低いため案A では対象外。必要になった時点で別タスクで切り出す。

## 結果

- テスト Suite: 8 → **21** (+13)
- テストケース: 29 → **91** (+62)
- カバレッジ Stmts: 27.33% → **67.66%** (+40.33pt)
- 80% 未達は、案A 方針で対象外とした `utils/db.ts` (334行) / `utils/fileSystem.ts` / RN フック群 / `useFabricRegister` 副作用部 が 0% のままのため。これらを除いた範囲ではほぼ完全カバー。

### リファクタリング(機能変更なし)

- `hooks/useDesignName.ts`: 言語解決を純粋関数 `getDesignName(design, language)` に抽出
- `features/editor/useSampledPolygons.ts`: サンプリング処理を純粋関数 `sampleDesignPolygons(design, samples)` に抽出
- `features/fabrics/fabricRegisterHelpers.ts` (新規): hook 内のヘルパー (`generateFabricId` / `defaultFabricName` / `resolveFabricMeta`) を切り出し、`useFabricRegister.ts` から import で利用

## メモ

- リファクタリング方針: ロジックは純粋関数として切り出し、副作用 (logger / DB / FS) を引数として注入できる形にしておく
- カバレッジ計測コマンド:
  ```bash
  npx jest --coverage --collectCoverageFrom='atoms/**/*.ts' \
    --collectCoverageFrom='utils/**/*.ts' \
    --collectCoverageFrom='hooks/**/*.ts' \
    --collectCoverageFrom='features/**/*.ts'
  ```
