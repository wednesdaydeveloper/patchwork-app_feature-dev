import type { EditablePiece } from '../types';

const COORD_PRECISION = 3;

function fmt(n: number): string {
  const rounded = Math.round(n * 10 ** COORD_PRECISION) / 10 ** COORD_PRECISION;
  // Remove trailing zeros after decimal point
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toString();
}

function cellPath(x0: number, y0: number, x1: number, y1: number): string {
  return `M ${fmt(x0)} ${fmt(y0)} L ${fmt(x1)} ${fmt(y0)} L ${fmt(x1)} ${fmt(y1)} L ${fmt(x0)} ${fmt(y1)} Z`;
}

/**
 * N列 × M行 の等分グリッドからピース一覧を生成する。
 * ピース ID は "p{col}{row}"（0-indexed）、
 * ラベルは位置に応じた英語キー（2×2 などの既知サイズ）または "piece_{col}_{row}"。
 */
export function generateGridPieces(cols: number, rows: number): EditablePiece[] {
  const pieces: EditablePiece[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col / cols;
      const y0 = row / rows;
      const x1 = (col + 1) / cols;
      const y1 = (row + 1) / rows;

      pieces.push({
        id: `p${col}${row}`,
        label: deriveLabel(col, row, cols, rows),
        path: cellPath(x0, y0, x1, y1),
        cells: { colStart: col, colEnd: col + 1, rowStart: row, rowEnd: row + 1 },
      });
    }
  }

  return pieces;
}

/**
 * 結合セルからピースを生成する（将来の merge 操作用）。
 */
export function pieceFromCells(
  colStart: number,
  rowStart: number,
  colEnd: number,
  rowEnd: number,
  totalCols: number,
  totalRows: number,
  id: string,
  label: string,
): EditablePiece {
  const x0 = colStart / totalCols;
  const y0 = rowStart / totalRows;
  const x1 = colEnd / totalCols;
  const y1 = rowEnd / totalRows;

  return {
    id,
    label,
    path: cellPath(x0, y0, x1, y1),
    cells: { colStart, colEnd, rowStart, rowEnd },
  };
}

// --- 位置に応じたデフォルトラベルのマッピング ---

const KNOWN_LABELS: Record<string, Record<string, string>> = {
  // 1×1
  '0,0,1,1': { '0,0': 'center' },
  // 1×2
  '0,0,1,2': { '0,0': 'top', '0,1': 'bottom' },
  // 2×1
  '0,0,2,1': { '0,0': 'left', '1,0': 'right' },
  // 2×2
  '0,0,2,2': {
    '0,0': 'topLeft',
    '1,0': 'topRight',
    '0,1': 'bottomLeft',
    '1,1': 'bottomRight',
  },
  // 3×3
  '0,0,3,3': {
    '0,0': 'topLeft',
    '1,0': 'topCenter',
    '2,0': 'topRight',
    '0,1': 'middleLeft',
    '1,1': 'center',
    '2,1': 'middleRight',
    '0,2': 'bottomLeft',
    '1,2': 'bottomCenter',
    '2,2': 'bottomRight',
  },
};

function deriveLabel(col: number, row: number, cols: number, rows: number): string {
  const gridKey = `0,0,${cols},${rows}`;
  const cellKey = `${col},${row}`;
  return KNOWN_LABELS[gridKey]?.[cellKey] ?? `piece_${col}_${row}`;
}

/** カテゴリキーをグリッドサイズから推測する（既知サイズのみ） */
export function suggestCategory(cols: number, rows: number): string {
  const n = Math.max(cols, rows);
  const categories: Record<number, string> = {
    2: 'twoGrid',
    3: 'threeGrid',
    4: 'fourGrid',
    5: 'fiveGrid',
  };
  return categories[n] ?? 'freeform';
}

/** gridSize を推測する（正方形グリッドのみ） */
export function suggestGridSize(cols: number, rows: number): number | null {
  return cols === rows ? cols : null;
}
