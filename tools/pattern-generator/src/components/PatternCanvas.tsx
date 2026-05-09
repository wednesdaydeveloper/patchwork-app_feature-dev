import { useCallback, useEffect, useRef, useState } from 'react';
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

interface ImgTransform {
  x: number;
  y: number;
  scale: number;
}

const DEFAULT_SIZE = 480;
const SCALE_MIN = 0.1;
const SCALE_MAX = 10;
const ZOOM_FACTOR = 1.15;

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

const INIT_TRANSFORM: ImgTransform = { x: 0, y: 0, scale: 1 };

export function PatternCanvas({
  pieces,
  cols,
  rows,
  referenceImageUrl,
  selectedPieceId,
  onSelectPiece,
  size = DEFAULT_SIZE,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const [imgTransform, setImgTransform] = useState<ImgTransform>(INIT_TRANSFORM);
  const [isDragging, setIsDragging] = useState(false);

  // Reset transform when image changes
  useEffect(() => {
    setImgTransform(INIT_TRANSFORM);
  }, [referenceImageUrl]);

  // Document-level mouse move / up for drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setImgTransform((prev) => ({
        ...prev,
        x: dragRef.current!.startTx + (e.clientX - dragRef.current!.startX),
        y: dragRef.current!.startTy + (e.clientY - dragRef.current!.startY),
      }));
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!referenceImageUrl) return;
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      setImgTransform((prev) => {
        const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          x: cx - (cx - prev.x) * ratio,
          y: cy - (cy - prev.y) * ratio,
        };
      });
    },
    [referenceImageUrl],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!referenceImageUrl) return;
      // Only start drag on background — not on SVG pieces (path elements)
      const target = e.target as Element;
      if (target.tagName === 'path' || target.tagName === 'text') return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTx: imgTransform.x,
        startTy: imgTransform.y,
      };
      setIsDragging(true);
    },
    [referenceImageUrl, imgTransform],
  );

  if (pieces.length === 0) {
    return (
      <div style={{ ...styles.container, width: size, height: size }}>
        <span style={styles.emptyHint}>← グリッドを設定して「生成」を押してください</span>
      </div>
    );
  }

  const viewBox = `0 0 ${size} ${size}`;
  const scaledPath = (path: string) =>
    path.replace(/(-?\d+(?:\.\d+)?)/g, (_, n) => String(parseFloat(n) * size));

  const hasRefImg = Boolean(referenceImageUrl);
  const containerCursor = isDragging ? 'grabbing' : hasRefImg ? 'grab' : 'default';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: size,
        height: size,
        border: '1px solid #ccc',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
        cursor: containerCursor,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Reference image layer */}
      {referenceImageUrl && (
        <img
          src={referenceImageUrl}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            transform: `translate(${imgTransform.x}px, ${imgTransform.y}px) scale(${imgTransform.scale})`,
            transformOrigin: '0 0',
            objectFit: 'fill',
            opacity: 0.4,
            pointerEvents: 'none',
            userSelect: 'none',
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

      {/* Image transform controls overlay */}
      {referenceImageUrl && (
        <div style={overlayStyles.bar}>
          <span style={overlayStyles.scale}>{Math.round(imgTransform.scale * 100)}%</span>
          <button
            style={overlayStyles.btn}
            title="拡大 (+15%)"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setImgTransform((prev) => {
                const newScale = Math.min(SCALE_MAX, prev.scale * ZOOM_FACTOR);
                const cx = size / 2;
                const cy = size / 2;
                const ratio = newScale / prev.scale;
                return { scale: newScale, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio };
              });
            }}
          >
            ＋
          </button>
          <button
            style={overlayStyles.btn}
            title="縮小 (-15%)"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setImgTransform((prev) => {
                const newScale = Math.max(SCALE_MIN, prev.scale / ZOOM_FACTOR);
                const cx = size / 2;
                const cy = size / 2;
                const ratio = newScale / prev.scale;
                return { scale: newScale, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio };
              });
            }}
          >
            ー
          </button>
          <button
            style={overlayStyles.btn}
            title="リセット"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setImgTransform(INIT_TRANSFORM); }}
          >
            ↺
          </button>
        </div>
      )}
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

const overlayStyles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    padding: '3px 6px',
    pointerEvents: 'all',
  },
  scale: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    minWidth: 36,
    textAlign: 'right',
  },
  btn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 4,
    padding: '1px 7px',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1.4,
  },
};
