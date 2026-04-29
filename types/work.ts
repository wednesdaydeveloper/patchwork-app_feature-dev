/**
 * パッチワーク（パターンに画像を対応づけして完成させた作品）
 */
export interface Work {
  id: string;
  name: string;
  designId: string;
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
 * - `scale`: 表示倍率。`1.0` で画像が bbox を cover（完全に覆う）する最小倍率。
 */
export interface PieceSetting {
  polygonId: string;
  fabricImageId: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}
