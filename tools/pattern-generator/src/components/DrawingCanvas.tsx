import { useCallback, useEffect, useRef, useState } from 'react';
import { buildOpenPath, buildSvgPath, fmt, scalePath, segmentMidpoint, snapCoord } from '../lib/pathBuilder';
import type { DrawingState, DrawingVertex, EditablePiece } from '../types';

interface Props {
  existingPieces: EditablePiece[];
  drawingState: DrawingState;
  onAddVertex: (v: DrawingVertex) => void;
  onClosePath: () => void;
  onToggleSegment: (segIdx: number) => void;
  onUpdateSegmentCP: (segIdx: number, cpIdx: 0 | 1, pos: DrawingVertex) => void;
  size?: number;
}

const DEFAULT_SIZE = 480;
const VERTEX_RADIUS = 6;
const FIRST_VERTEX_RADIUS = 9;
const CLOSE_THRESHOLD = 0.04; // normalized distance to snap-close

const EXISTING_COLORS = [
  'rgba(100,160,220,0.20)',
  'rgba(220,100,160,0.20)',
  'rgba(100,220,150,0.20)',
  'rgba(220,200,100,0.20)',
  'rgba(160,100,220,0.20)',
  'rgba(100,220,220,0.20)',
];

const SEG_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  L: { fill: '#fff', stroke: '#555', text: '#333' },
  A: { fill: '#ff8c00', stroke: '#cc6600', text: '#fff' },
  Q: { fill: '#22aa44', stroke: '#187730', text: '#fff' },
  C: { fill: '#7744cc', stroke: '#5530aa', text: '#fff' },
};

export function DrawingCanvas({
  existingPieces,
  drawingState,
  onAddVertex,
  onClosePath,
  onToggleSegment,
  onUpdateSegmentCP,
  size = DEFAULT_SIZE,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<DrawingVertex | null>(null);
  const cpDragRef = useRef<{ segIdx: number; cpIdx: 0 | 1 } | null>(null);

  const toNorm = useCallback(
    (clientX: number, clientY: number): DrawingVertex => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const raw = {
        x: (clientX - rect.left) / size,
        y: (clientY - rect.top) / size,
      };
      if (drawingState.snapDivisions > 0) {
        return {
          x: snapCoord(raw.x, drawingState.snapDivisions),
          y: snapCoord(raw.y, drawingState.snapDivisions),
        };
      }
      return raw;
    },
    [size, drawingState.snapDivisions],
  );

  const toSvg = (v: DrawingVertex) => ({ x: v.x * size, y: v.y * size });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const v = toNorm(e.clientX, e.clientY);
      const clamped: DrawingVertex = {
        x: Math.max(0, Math.min(1, v.x)),
        y: Math.max(0, Math.min(1, v.y)),
      };
      setCursor(clamped);

      if (cpDragRef.current !== null) {
        const { segIdx, cpIdx } = cpDragRef.current;
        onUpdateSegmentCP(segIdx, cpIdx, clamped);
      }
    },
    [toNorm, onUpdateSegmentCP],
  );

  const handlePointerLeave = useCallback(() => setCursor(null), []);

  // Clear CP drag on pointer up (document-level to catch releases outside SVG)
  useEffect(() => {
    const onUp = () => { cpDragRef.current = null; };
    document.addEventListener('pointerup', onUp);
    return () => document.removeEventListener('pointerup', onUp);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (drawingState.closed) return;
      const v = toNorm(e.clientX, e.clientY);
      const clamped: DrawingVertex = {
        x: Math.max(0, Math.min(1, v.x)),
        y: Math.max(0, Math.min(1, v.y)),
      };

      // If 3+ vertices, check if close to first vertex → close path
      if (drawingState.vertices.length >= 3) {
        const first = drawingState.vertices[0];
        const dist = Math.hypot(clamped.x - first.x, clamped.y - first.y);
        if (dist <= CLOSE_THRESHOLD) {
          onClosePath();
          return;
        }
      }

      onAddVertex(clamped);
    },
    [drawingState, toNorm, onAddVertex, onClosePath],
  );

  const { vertices, segments, closed } = drawingState;
  const n = vertices.length;

  // Build the open (in-progress) path string
  const openPathD = n >= 2 ? buildOpenPath(vertices, segments) : '';

  // Build the closed path string (only when closed)
  const closedPathD = closed && n >= 3 ? buildSvgPath(vertices, segments) : '';

  // Preview line from last vertex to cursor
  const lastV = n > 0 ? vertices[n - 1] : null;

  // Check if cursor is near first vertex (show close indicator)
  const nearFirst =
    !closed && n >= 3 && cursor && (() => {
      const first = vertices[0];
      return Math.hypot(cursor.x - first.x, cursor.y - first.y) <= CLOSE_THRESHOLD;
    })();

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        border: '2px solid #4a90d9',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
        cursor: closed ? 'default' : 'crosshair',
      }}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, userSelect: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {/* Unit square border */}
        <rect x={0} y={0} width={size} height={size} fill="none" stroke="#ddd" strokeWidth={1} />

        {/* Snap grid */}
        {drawingState.snapDivisions > 0 && drawingState.snapDivisions <= 16 && (
          <g stroke="#eee" strokeWidth={0.5}>
            {Array.from({ length: drawingState.snapDivisions - 1 }, (_, i) => {
              const v = ((i + 1) / drawingState.snapDivisions) * size;
              return (
                <g key={i}>
                  <line x1={v} y1={0} x2={v} y2={size} />
                  <line x1={0} y1={v} x2={size} y2={v} />
                </g>
              );
            })}
          </g>
        )}

        {/* Existing pieces */}
        {existingPieces.map((piece, idx) => {
          const scaled = scalePath(piece.path, size);
          return (
            <path
              key={piece.internalId}
              d={scaled}
              fill={EXISTING_COLORS[idx % EXISTING_COLORS.length]}
              stroke="#aaa"
              strokeWidth={1}
            />
          );
        })}

        {/* Completed (closed) path preview */}
        {closedPathD && (
          <path
            d={scalePath(closedPathD, size)}
            fill="rgba(74,144,217,0.25)"
            stroke="#1a6ab8"
            strokeWidth={2}
          />
        )}

        {/* Open (in-progress) path */}
        {openPathD && !closed && (
          <path
            d={scalePath(openPathD, size)}
            fill="none"
            stroke="#1a6ab8"
            strokeWidth={2}
          />
        )}

        {/* Preview line: last vertex → cursor */}
        {!closed && lastV && cursor && (
          <line
            x1={lastV.x * size}
            y1={lastV.y * size}
            x2={cursor.x * size}
            y2={cursor.y * size}
            stroke="#4a90d9"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.7}
          />
        )}

        {/* Control point handles and cage lines (only for closed path) */}
        {closed &&
          segments.map((seg, i) => {
            const from = vertices[i];
            const to = vertices[(i + 1) % n];
            const svFrom = toSvg(from);
            const svTo = toSvg(to);

            if (seg.kind === 'Q') {
              const cp = toSvg({ x: seg.cpx, y: seg.cpy });
              return (
                <g key={`cp-${i}`}>
                  <line x1={svFrom.x} y1={svFrom.y} x2={cp.x} y2={cp.y}
                    stroke="#22aa44" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  <line x1={cp.x} y1={cp.y} x2={svTo.x} y2={svTo.y}
                    stroke="#22aa44" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  <circle
                    cx={cp.x} cy={cp.y} r={6}
                    fill="#22aa44" stroke="#187730" strokeWidth={1.5}
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      cpDragRef.current = { segIdx: i, cpIdx: 0 };
                      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
                    }}
                  />
                </g>
              );
            }

            if (seg.kind === 'C') {
              const cp1 = toSvg({ x: seg.cp1x, y: seg.cp1y });
              const cp2 = toSvg({ x: seg.cp2x, y: seg.cp2y });
              return (
                <g key={`cp-${i}`}>
                  <line x1={svFrom.x} y1={svFrom.y} x2={cp1.x} y2={cp1.y}
                    stroke="#7744cc" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  <line x1={cp2.x} y1={cp2.y} x2={svTo.x} y2={svTo.y}
                    stroke="#7744cc" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  <circle
                    cx={cp1.x} cy={cp1.y} r={6}
                    fill="#7744cc" stroke="#5530aa" strokeWidth={1.5}
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      cpDragRef.current = { segIdx: i, cpIdx: 0 };
                      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
                    }}
                  />
                  <circle
                    cx={cp2.x} cy={cp2.y} r={6}
                    fill="#7744cc" stroke="#5530aa" strokeWidth={1.5}
                    style={{ cursor: 'grab' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      cpDragRef.current = { segIdx: i, cpIdx: 1 };
                      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
                    }}
                  />
                </g>
              );
            }

            return null;
          })}

        {/* Segment midpoint handles (only for closed path) */}
        {closed &&
          segments.map((seg, i) => {
            const from = vertices[i];
            const to = vertices[(i + 1) % n];
            const mid = segmentMidpoint(from, to, seg);
            const sm = toSvg(mid);
            const colors = SEG_COLORS[seg.kind] ?? SEG_COLORS.L;
            return (
              <g key={`seg-handle-${i}`}>
                <circle
                  cx={sm.x}
                  cy={sm.y}
                  r={7}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); onToggleSegment(i); }}
                />
                <text
                  x={sm.x}
                  y={sm.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill={colors.text}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {seg.kind}
                </text>
              </g>
            );
          })}

        {/* Vertices */}
        {vertices.map((v, i) => {
          const sv = toSvg(v);
          const isFirst = i === 0;
          const isNearFirst = isFirst && nearFirst;
          const r = isFirst ? FIRST_VERTEX_RADIUS : VERTEX_RADIUS;
          return (
            <circle
              key={`v-${i}`}
              cx={sv.x}
              cy={sv.y}
              r={r}
              fill={isNearFirst ? '#ff4444' : isFirst ? '#4a90d9' : '#fff'}
              stroke={isNearFirst ? '#cc0000' : '#1a6ab8'}
              strokeWidth={2}
              style={{ cursor: !closed && isFirst && n >= 3 ? 'pointer' : 'default' }}
            />
          );
        })}

        {/* Cursor snap indicator */}
        {!closed && cursor && (
          <g>
            <circle
              cx={cursor.x * size}
              cy={cursor.y * size}
              r={3}
              fill={nearFirst ? '#ff4444' : '#4a90d9'}
              opacity={0.8}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )}

        {/* Vertex coordinate labels (only for small vertex counts) */}
        {n <= 8 &&
          vertices.map((v, i) => {
            const sv = toSvg(v);
            return (
              <text
                key={`vlbl-${i}`}
                x={sv.x + 10}
                y={sv.y - 6}
                fontSize={9}
                fill="#555"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {fmt(v.x)},{fmt(v.y)}
              </text>
            );
          })}
      </svg>

      {/* HUD overlay */}
      <div style={hudStyles.hud}>
        {!closed ? (
          <>
            <span>{n} 頂点</span>
            {n < 3 && <span style={hudStyles.hint}>クリックして頂点を追加</span>}
            {n >= 3 && (
              <span style={hudStyles.hint}>
                最初の頂点（青丸）をクリックして閉じる
              </span>
            )}
          </>
        ) : (
          <span style={hudStyles.ok}>✓ パス確定 — ○ クリックで種類切替 / 制御点ドラッグで形状調整</span>
        )}
      </div>
    </div>
  );
}

const hudStyles: Record<string, React.CSSProperties> = {
  hud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 11,
    padding: '4px 10px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hint: { color: '#aad' },
  ok: { color: '#7ef5a0' },
};
