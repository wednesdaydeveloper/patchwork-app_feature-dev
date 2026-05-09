# iPhone 実機にインストールする手順

Expo Go ではなく、自分の iPhone に **ネイティブアプリとして直接インストール** する手順。Windows 環境のみで完結する EAS Build (Expo のクラウドビルド) を使うため、Mac は不要。

> 配布規模を広げたい場合(複数人に配布)は TestFlight を使う。本書末尾の [TestFlight](#testflight複数人へ配布する場合) を参照。

## 前提条件

- **Apple Developer Program 加入済み**(年間 $99)
- Expo アカウント (https://expo.dev/)
- Node.js / npm セットアップ済み
- EAS CLI: `npm install -g eas-cli`
- iPhone (iOS 15.1+ 推奨)
- iPhone を Apple ID でサインイン済み

## ステップ概要

1. [初回セットアップ](#1-初回セットアップ一回だけ) ← `bundleIdentifier` 変更, `eas.json` プロファイル追加, デバイス登録
2. [ビルド & インストール](#2-ビルド--インストール毎回) ← コード更新のたびに繰り返す
3. [トラブルシューティング](#3-トラブルシューティング)

---

## 1. 初回セットアップ(一回だけ)

### 1-1. EAS にログイン

```powershell
eas login
```

Expo アカウントの認証情報でログインする。

### 1-2. Bundle Identifier を変更(必須)

`app.json` の `ios.bundleIdentifier` と `android.package` は現在 `com.example.patchworkapp` で、これは仮の値。実際の所有ドメインの逆順に変更する。

```diff
  "ios": {
-   "bundleIdentifier": "com.example.patchworkapp",
+   "bundleIdentifier": "com.<your-domain>.patchwork",
    ...
  },
  "android": {
-   "package": "com.example.patchworkapp",
+   "package": "com.<your-domain>.patchwork",
    ...
  }
```

> **理由**: Apple Developer アカウントに登録される App ID と Bundle ID が一致する必要があり、`com.example.*` のような汎用ドメインだと App Store Connect 側で他者が登録済みの可能性がある。所有ドメインの逆順を使うのが標準。

### 1-3. eas.json に実機向けプロファイルを追加

既存の `preview` プロファイルは `ios.simulator: true` でシミュレーター専用のため、実機向けには新しいプロファイルを追加する。

`eas.json` の `build` セクションに以下を追記:

```diff
  "preview": {
    "distribution": "internal",
    "channel": "preview",
    "ios": {
      "simulator": true
    }
  },
+ "preview-device": {
+   "distribution": "internal",
+   "channel": "preview"
+ },
  "production": {
    ...
  }
```

`distribution: "internal"` + `ios.simulator` 未指定 で **実機向け Internal Distribution ビルド** になる。

### 1-4. プロジェクトを EAS に紐付け

```powershell
eas init
```

(初回のみ必要。`app.json` に `extra.eas.projectId` が追加される)

### 1-5. iPhone を Apple Developer に登録

```powershell
eas device:create
```

実行すると CLI が QR コード or URL を表示するので、**iPhone の Safari で開く**(カメラアプリの QR スキャン経由でも可)。Safari の指示に従ってプロビジョニングプロファイルをインストールすると、Apple Developer アカウントに iPhone が登録される。

複数の端末を登録する場合は端末ごとに `eas device:create` を再実行。

### 1-6. iOS 証明書のセットアップ

初回ビルド時に EAS CLI が自動で行うが、事前に確認したい場合:

```powershell
eas credentials --platform ios
```

「Distribution Certificate」と「Provisioning Profile」を EAS が管理することを許可する(対話形式で進む)。

---

## 2. ビルド & インストール(毎回)

### 2-1. ビルド開始

```powershell
eas build --platform ios --profile preview-device
```

EAS のクラウドキューに投入される。所要時間は **約 10〜30 分**(混雑次第)。完了するとブラウザの Expo ダッシュボードに遷移する。

CLI には進捗 URL が表示される:
```
Build details: https://expo.dev/accounts/<account>/projects/patchwork-app/builds/<build-id>
```

### 2-2. iPhone でインストール

ビルド完了後、**Expo ダッシュボードのビルド詳細ページ**を開くと QR コードまたは Install URL が表示される。

iPhone で:
1. **Safari** でビルド URL を開く(カメラアプリの QR スキャンでも可)
2. 「インストール」をタップ
3. ホーム画面にアプリアイコンが追加される

### 2-3. 信頼設定(初回起動時のみ)

アプリを起動すると「信頼されていない開発元」のエラーが出る場合:

1. **設定 > 一般 > VPN とデバイス管理**
2. **デベロッパー App** セクションに表示される自分の Apple Developer アカウント名をタップ
3. **「< Apple Developer 名 > を信頼」** をタップ
4. 確認ダイアログで再度「信頼」

以降アプリが起動可能になる。

---

## コード更新時

コードを変更したら再度 `eas build --platform ios --profile preview-device` を実行。新しいビルドの URL/QR から再インストール(同じ Bundle ID なので上書き、データは保持される)。

## 3. トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `eas build` で「No bundle identifier specified」 | `app.json` の `ios.bundleIdentifier` が設定されているか確認 |
| ビルド成功するがインストール時に「インストールできません」 | `eas device:create` で UDID 登録 → 再ビルド |
| 起動時に「信頼されていない開発元」が消えない | 1-2 で示した「信頼」操作を再実行 |
| `eas credentials` でエラー | Apple Developer アカウントのログインを `eas` 内で再認証 |
| Bundle ID 重複エラー | App Store Connect で同じ Bundle ID が他に登録されていないか確認 |
| ビルド失敗 (Provisioning Profile invalid) | `eas credentials --platform ios` で Provisioning Profile を再生成 |

---

## TestFlight(複数人へ配布する場合)

Internal Distribution は登録済み端末のみだが、TestFlight ならテスター招待で広く配布できる(Apple 審査が入るが Internal Testing なら短時間)。

```powershell
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

詳細は [docs/build-release.md](./build-release.md) の「提出」セクションを参照。

---

## 参考

- [EAS Build introduction](https://docs.expo.dev/build/introduction/)
- [EAS Build internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [eas device:create reference](https://docs.expo.dev/eas/json/#devices)
