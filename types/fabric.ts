/**
 * 布地画像（ユーザーがカメラ・カメラロールから登録する画像）
 *
 * - `imagePath`: `expo-file-system` のドキュメントディレクトリ配下のパス。
 * - `category`: ユーザー入力の自由文字列。空文字（未分類）も許容。
 */
export interface FabricImage {
  id: string;
  name: string;
  category: string;
  imagePath: string;
  /**
   * キャリブレーション値: 画像 1mm あたりのピクセル数。
   * `null` は未キャリブレーション（旧データ・移行前）。実寸描画時はフォールバック処理する。
   */
  pxPerMm: number | null;
  createdAt: Date;
}
