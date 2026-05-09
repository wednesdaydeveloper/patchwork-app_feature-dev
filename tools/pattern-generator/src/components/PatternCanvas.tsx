import type { EditablePiece } from '../types';

interface Props {
  pieces: EditablePiece[];
  cols: number;
  rows: number;
  referenceImageUrl: string | null;
  selectedPieceId: string | null;
  onSelectPiece: (id: string) => void;
  size?: number;
}

const DEFAULT_SIZE = 480;

const FILL_COLORS = [
  'rgba(100,160,220,0.25)',
  'rgba(220,100,160,0.25)',
  'rgba(100,220,150,0.25)',
  'rgba(220,200,100,0.25)',
  'rgba(160,100,220,0.25)',
  'rgba(100,220,220,0.25)',
  'rgba(220,150,100,0.25)',
  'rgba(100,100,220,0.25)',
  'rgba(220,220,100,0.25)',
  'rgba(100,220,100,0.25)',
];

export function PatternCanvas({
  pieces,
  cols,
  rows,
  referenceImageUrl,
  selectedPieceId,
  onSelectPiece,
  size = DEFAULT_SIZE,
}: Props) {
  if (pieces.length === 0) {
    return (
      <div style={{ ...styles.container, width: size, height: size }}>
        <span style={styles.emptyHint}>← グリッドを設定して「生成」を押してください</span>
      </div>
    );
  }

  // Scale path from normalized 0-1 to SVG viewport coordinates
  const viewBox = `0 0 ${size} ${size}`;

  const scaledPath = (path: string) =>
    path.replace(/(-?\d+(?:\.\d+)?)/g, (_, n) => String(parseFloat(n) * size));

  return (
    <div style={{ position: 'relative', width: size, height: size, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
      {/* Reference image layer */}
      {referenceImageUrl && (
        <img
          src={referenceImageUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: size, height: size,
            objectFit: 'fill',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* SVG piece layer */}
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {pieces.map((piece, idx) => {
          const isSelected = piece.internalId === selectedPieceId;
          const fill = isSelected ? 'rgba(74,144,217,0.45)' : FILL_COLORS[idx % FILL_COLORS.length];
          return (
            <path
              key={piece.internalId}
              d={scaledPath(piece.path)}
              fill={fill}
              stroke={isSelected ? '#1a6ab8' : '#333'}
              strokeWidth={isSelected ? 2 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectPiece(piece.internalId)}
            />
          );
        })}

        {/* Grid lines overlay */}
        {cols > 0 && rows > 0 && (
          <g stroke="#aaa" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.6}>
            {Array.from({ length: cols - 1 }, (_, i) => {
              const x = ((i + 1) / cols) * size;
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={size} />;
            })}
            {Array.from({ length: rows - 1 }, (_, i) => {
              const y = ((i + 1) / rows) * size;
              return <line key={`h${i}`} x1={0} y1={y} x2={size} y2={y} />;
            })}
          </g>
        )}

        {/* Piece labels */}
        {pieces.map((piece) => {
          const cx = pieceCenterX(piece, cols) * size;
          const cy = pieceCenterY(piece, rows) * size;
          return (
            <text
              key={`lbl-${piece.internalId}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(11, size / (Math.max(cols, rows) * 2.5))}
              fill="#333"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {piece.id}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function pieceCenterX(piece: EditablePiece, totalCols: number): number {
  const { colStart, colEnd } = piece.cells;
  return (colStart + colEnd) / 2 / totalCols;
}

function pieceCenterY(piece: EditablePiece, totalRows: number): number {
  const { rowStart, rowEnd } = piece.cells;
  return (rowStart + rowEnd) / 2 / totalRows;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: '#fafafa',
  },
  emptyHint: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    padding: 16,
  },
};
