/** ツール内で扱う編集可能なピース */
export interface EditablePiece {
  /** 内部管理用の不変ID（UUID）。選択・更新・React keyに使用 */
  internalId: string;
  id: string;
  /** SVG path data (正規化座標 0.0〜1.0、Z で閉じる) */
  path: string;
  /** グリッド上の対応セル範囲 (merging 用、将来利用) */
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
    polygons: { id: string; path: string }[];
  };
}

// ---------- 手描きモード ----------

/** 正規化座標 (0-1) の頂点 */
export interface DrawingVertex {
  x: number;
  y: number;
}

/**
 * セグメント定義。
 * - L: 直線
 * - A: 円弧。sagitta = 弦中点からアーク中点への符号付き距離
 *   正 → 弦方向の右側に膨らむ（SVG Y軸下向き座標系）
 *   負 → 左側に膨らむ
 * - Q: 2 次ベジェ曲線（制御点 1 個）
 * - C: 3 次ベジェ曲線（制御点 2 個）
 */
export type SegmentType =
  | { kind: 'L' }
  | { kind: 'A'; sagitta: number }
  | { kind: 'Q'; cpx: number; cpy: number }
  | { kind: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number };

/** 手描きモードの状態 */
export interface DrawingState {
  active: boolean;
  /** 現在描画中の頂点列 (正規化座標) */
  vertices: DrawingVertex[];
  /**
   * セグメント定義。
   * 描画中（open）: length = vertices.length - 1
   *   segments[i]: vertices[i] → vertices[i+1]
   * 完成（closed）: length = vertices.length
   *   segments[i]: vertices[i] → vertices[(i+1)%n]（最後の要素が閉じるエッジ）
   */
  segments: SegmentType[];
  /** パスが閉じているか（完成して確認待ち） */
  closed: boolean;
  /** スナップグリッドの分割数（0=スナップなし） */
  snapDivisions: number;
}

export const INITIAL_DRAWING_STATE: DrawingState = {
  active: false,
  vertices: [],
  segments: [],
  closed: false,
  snapDivisions: 12,
};
