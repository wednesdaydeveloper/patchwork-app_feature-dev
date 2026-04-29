import { Directory, File, Paths } from 'expo-file-system';

const FABRICS_SUBDIR = 'fabrics';

/**
 * 布地画像保存先のディレクトリ。アプリのドキュメント領域配下。
 */
function fabricsDirectory(): Directory {
  return new Directory(Paths.document, FABRICS_SUBDIR);
}

/**
 * 保存ディレクトリが無ければ作成する（idempotent）。
 */
function ensureFabricsDirectory(): Directory {
  const dir = fabricsDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/**
 * ソース URI（カメラロール / カメラ）からドキュメント領域の `fabrics/` へ画像をコピーする。
 *
 * @param sourceUri カメラ・カメラロールから返却された URI（`file://...` 等）
 * @param fabricId 一意な布地 ID（衝突回避のためファイル名に使う）
 * @returns 保存後のローカル URI
 */
export function saveFabricImage(sourceUri: string, fabricId: string): string {
  ensureFabricsDirectory();
  const extension = inferExtension(sourceUri);
  const dest = new File(Paths.document, FABRICS_SUBDIR, `${fabricId}${extension}`);
  if (dest.exists) {
    dest.delete();
  }
  const source = new File(sourceUri);
  source.copy(dest);
  return dest.uri;
}

/**
 * 布地画像を物理削除する。存在しなければ何もしない（idempotent）。
 */
export function deleteFabricImage(localUri: string): void {
  const file = new File(localUri);
  if (file.exists) {
    file.delete();
  }
}

/**
 * 元 URI から拡張子を推測する。判別不能なら `.jpg` をデフォルトとする。
 * （`expo-image-picker` で取得する画像は jpg / png / heic 等）
 */
function inferExtension(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(uri);
  if (match) {
    return `.${match[1].toLowerCase()}`;
  }
  return '.jpg';
}

/**
 * 利用可能なディスク容量（バイト）を取得する。
 * 保存・エクスポート前の事前チェック（タスク #42）に利用。
 */
export function getAvailableDiskSpace(): number {
  return Paths.availableDiskSpace;
}
