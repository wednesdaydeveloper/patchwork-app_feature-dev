/**
 * パッチワーク（パターンに画像を対応づけして完成させた作品）
 */
/** パッチワーク一辺の物理サイズの範囲（mm） */
export const WORK_SIZE_MM_MIN = 50;
export const WORK_SIZE_MM_MAX = 280;
export const WORK_SIZE_MM_DEFAULT = 150;

export interface Work {
  id: string;
  name: string;
  designId: string;
  /** パッチワーク一辺の物理サイズ（mm）。50〜280、デフォルト 150。 */
  sizeMm: number;
  createdAt: Date;
  updatedAt: Date;
  pieceSettings: PieceSetting[];
}

/**
 * ピース設定（特定の Work の特定の Polygon に対応づけた画像と表示パラメータ）
 *
 * 座標系（CLAUDE.md「ピース内画像座標系」参照）:
 * - `offsetX`, `offsetY`: ピース bbox の幅・高さを 1 とした正規化オフセット
 *   （`(0, 0)` で画像中心が bbox 中心と一致）
 * - `rotation`: 画像中心まわりの回転（ラジアン）。デフォルト 0。
 */
export interface PieceSetting {
  polygonId: string;
  fabricImageId: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
}
