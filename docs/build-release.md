# ビルド・リリース手順

#45 で整備した EAS Build / `app.json` 設定の使い方。

## 前提

- [Expo アカウント](https://expo.dev/) にサインアップ済み
- `npm install -g eas-cli` で EAS CLI をインストール済み
- リポジトリで `eas login` 済み

## 設定ファイル

| ファイル   | 役割                                                         |
| ---------- | ------------------------------------------------------------ |
| `app.json` | iOS / Android の Bundle ID、パーミッション文言、アイコン設定 |
| `eas.json` | development / preview / production のビルドプロファイル      |

### iOS パーミッション

`app.json` の `ios.infoPlist` に以下を記載済み:

- `NSCameraUsageDescription` — 布地撮影
- `NSPhotoLibraryUsageDescription` — 布地画像をライブラリから選択
- `NSPhotoLibraryAddUsageDescription` — 完成画像をライブラリへ保存

### Android パーミッション

`android.permissions` に以下を記載済み:

- `android.permission.CAMERA`
- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`

`expo-image-picker` / `expo-media-library` の Expo プラグインも `plugins` で文言上書き済み。

## アイコン・スプラッシュ

| 用途              | パス                            |
| ----------------- | ------------------------------- |
| アプリアイコン    | `./assets/icon.png`             |
| スプラッシュ      | `./assets/splash-icon.png`      |
| Android Adaptive  | `./assets/adaptive-icon.png`    |
| Web Favicon       | `./assets/favicon.png`          |

差し替えはサイズ規定（icon: 1024×1024, splash: 1284×2778 推奨）に従うこと。

## ビルド

```bash
# 開発ビルド（Expo Go でなく Dev Client を使う場合）
eas build --platform ios --profile development
eas build --platform android --profile development

# 内部配布（TestFlight / Internal App Sharing）
eas build --platform all --profile preview

# 本番ビルド
eas build --platform all --profile production
```

## 提出

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## ローカル検証

EAS にプッシュする前に下記を実施:

1. `npx tsc --noEmit` で型エラーゼロ
2. `npm run test` で全テスト通過
3. `npx expo prebuild --clean` でネイティブプロジェクト生成が成功
4. `npx expo run:ios` / `npx expo run:android` でローカル実行確認

## 既知の TODO

- 本番環境用の Bundle ID（`com.example.patchworkapp`）を実際の所有ドメインに置き換える
- アプリ申請に必要なスクリーンショット・プライバシーポリシーの準備は別途
