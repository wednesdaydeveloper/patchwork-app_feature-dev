/** ツール内で扱う編集可能なピース */
export interface EditablePiece {
  /** 内部管理用の不変ID（UUID）。選択・更新・React keyに使用 */
  internalId: string;
  id: string;
  label: string;
  /** SVG path data (正規化座標 0.0〜1.0、Z で閉じる) */
  path: string;
  /** グリッド上の対応セル範囲 (merging 用、Phase 2) */
  cells: { colStart: number; colEnd: number; rowStart: number; rowEnd: number };
}

/** デザインのメタ情報（入力フォーム用） */
export interface DesignMetadata {
  id: string;
  name: string;
  nameJa: string;
  category: string;
  gridSize: number | null;
  thumbnailFilename: string;
}

/** ツール全体の状態 */
export interface AppState {
  referenceImageUrl: string | null;
  cols: number;
  rows: number;
  pieces: EditablePiece[];
  metadata: DesignMetadata;
  selectedPieceId: string | null;
}

/** ダウンロード用 JSON のルート型 */
export interface DesignFileOutput {
  version: '1.0';
  design: {
    id: string;
    name: string;
    nameJa: string;
    category: string;
    gridSize: number | null;
    thumbnail: string;
    polygons: { id: string; label: string; path: string }[];
  };
}
