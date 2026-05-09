import type { DrawingVertex, SegmentType } from '../types';

// ---------- Path scaling ----------

/**
 * Scale coordinate/radius values in an SVG path string by `factor`.
 * For A/a arc commands, x-rotation (param 3), large-arc-flag (param 4), and
 * sweep-flag (param 5) are left unchanged — only rx, ry, x, y are scaled.
 */
export function scalePath(d: string, factor: number): string {
  const tokens =
    d.match(/[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d*\.)?\d+(?:[eE][+-]?\d+)?/g) ?? [];
  // Within an A/a command the 7 params are: rx ry x-rotation large-arc sweep-flag x y
  // Indices 2, 3, 4 (x-rotation, large-arc-flag, sweep-flag) must NOT be multiplied.
  const ARC_SKIP = new Set([2, 3, 4]);
  let cmd = '';
  let paramIdx = 0;

  return tokens
    .map((token) => {
      if (/^[MmLlHhVvCcSsQqTtAaZz]$/.test(token)) {
        cmd = token;
        paramIdx = 0;
        return token;
      }
      const isArc = cmd === 'A' || cmd === 'a';
      const skip = isArc && ARC_SKIP.has(paramIdx % 7);
      paramIdx++;
      return skip ? token : String(parseFloat(token) * factor);
    })
    .join(' ');
}

// ---------- Coordinate utils ----------

const COORD_PRECISION = 4;

export function fmt(n: number): string {
  const r = Math.round(n * 10 ** COORD_PRECISION) / 10 ** COORD_PRECISION;
  return r % 1 === 0 ? r.toFixed(0) : r.toString();
}

export function snapCoord(value: number, divisions: number): number {
  if (divisions <= 0) return value;
  return Math.round(value * divisions) / divisions;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ---------- Arc math ----------

export interface ArcParams {
  rx: number;
  largeArcFlag: 0 | 1;
  sweepFlag: 0 | 1;
}

/**
 * Compute SVG arc parameters from a signed sagitta value.
 *
 * sagitta: signed perpendicular distance from chord midpoint to arc midpoint.
 *   positive → arc bulges to the RIGHT of the chord direction (p1→p2)
 *   negative → arc bulges to the LEFT
 *
 * Convention with SVG Y-down:
 *   "right of chord" = rotate direction vector 90° clockwise in SVG space
 *   positive sagitta + Y-down → sweepFlag=1 (arc sweeps clockwise on screen)
 */
export function sagittaToArcParams(
  p1: DrawingVertex,
  p2: DrawingVertex,
  sagitta: number,
): ArcParams {
  const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const s = Math.abs(sagitta);

  if (d < 1e-10 || s < 1e-6) {
    // Degenerate: return a very large radius (visually straight)
    return { rx: 1e4, largeArcFlag: 0, sweepFlag: 1 };
  }

  // Sagitta-chord formula: r = d² / (8s) + s / 2
  const rx = (d * d) / (8 * s) + s / 2;

  // largeArcFlag: arc spans > 180° when s > d/2
  const largeArcFlag: 0 | 1 = s > d / 2 ? 1 : 0;

  // sweepFlag in SVG (Y-down): positive sagitta = bulge right = clockwise = 1
  const sweepFlag: 0 | 1 = sagitta > 0 ? 1 : 0;

  return { rx, largeArcFlag, sweepFlag };
}

/**
 * Compute the visual midpoint on the arc (used for segment handles).
 * right-normal in SVG Y-down: rotate (dx,dy) by 90° CW → (dy, -dx)
 */
export function arcMidpoint(
  p1: DrawingVertex,
  p2: DrawingVertex,
  sagitta: number,
): DrawingVertex {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-10) return { x: mx, y: my };
  // Right-normal (perpendicular right of chord, SVG Y-down)
  const nx = dy / len;
  const ny = -dx / len;
  return { x: mx + nx * sagitta, y: my + ny * sagitta };
}

// ---------- SVG path builder ----------

/**
 * Build an SVG path string from vertices + segment definitions.
 *
 * vertices: N points (normalized 0-1 coords)
 * segments: N elements; segments[i] describes the edge from vertices[i] to vertices[(i+1)%N]
 *
 * Always returns a closed path (ends with Z).
 */
export function buildSvgPath(vertices: DrawingVertex[], segments: SegmentType[]): string {
  const n = vertices.length;
  if (n < 2) return '';

  let d = `M ${fmt(vertices[0].x)} ${fmt(vertices[0].y)}`;

  for (let i = 0; i < n; i++) {
    const to = vertices[(i + 1) % n];
    const seg = segments[i];

    const from = vertices[i];
    if (seg.kind === 'L') {
      d += ` L ${fmt(to.x)} ${fmt(to.y)}`;
    } else if (seg.kind === 'A') {
      const { rx, largeArcFlag, sweepFlag } = sagittaToArcParams(from, to, seg.sagitta);
      d += ` A ${fmt(rx)} ${fmt(rx)} 0 ${largeArcFlag} ${sweepFlag} ${fmt(to.x)} ${fmt(to.y)}`;
    } else if (seg.kind === 'Q') {
      d += ` Q ${fmt(seg.cpx)} ${fmt(seg.cpy)} ${fmt(to.x)} ${fmt(to.y)}`;
    } else {
      d += ` C ${fmt(seg.cp1x)} ${fmt(seg.cp1y)} ${fmt(seg.cp2x)} ${fmt(seg.cp2y)} ${fmt(to.x)} ${fmt(to.y)}`;
    }
  }

  d += ' Z';
  return d;
}

/**
 * Build a partial path for the in-progress drawing (open path, no closing segment).
 */
export function buildOpenPath(vertices: DrawingVertex[], segments: SegmentType[]): string {
  const n = vertices.length;
  if (n < 1) return '';

  let d = `M ${fmt(vertices[0].x)} ${fmt(vertices[0].y)}`;

  for (let i = 0; i < n - 1; i++) {
    const to = vertices[i + 1];
    const seg = segments[i];

    const from = vertices[i];
    if (seg.kind === 'L') {
      d += ` L ${fmt(to.x)} ${fmt(to.y)}`;
    } else if (seg.kind === 'A') {
      const { rx, largeArcFlag, sweepFlag } = sagittaToArcParams(from, to, seg.sagitta);
      d += ` A ${fmt(rx)} ${fmt(rx)} 0 ${largeArcFlag} ${sweepFlag} ${fmt(to.x)} ${fmt(to.y)}`;
    } else if (seg.kind === 'Q') {
      d += ` Q ${fmt(seg.cpx)} ${fmt(seg.cpy)} ${fmt(to.x)} ${fmt(to.y)}`;
    } else {
      d += ` C ${fmt(seg.cp1x)} ${fmt(seg.cp1y)} ${fmt(seg.cp2x)} ${fmt(seg.cp2y)} ${fmt(to.x)} ${fmt(to.y)}`;
    }
  }

  return d;
}

/** Midpoint of a segment at t=0.5 (for interactive handles). */
export function segmentMidpoint(
  p1: DrawingVertex,
  p2: DrawingVertex,
  seg: SegmentType,
): DrawingVertex {
  if (seg.kind === 'A' && Math.abs(seg.sagitta) > 1e-6) {
    return arcMidpoint(p1, p2, seg.sagitta);
  }
  if (seg.kind === 'Q') {
    // Quadratic Bezier at t=0.5: 0.25·P0 + 0.5·CP + 0.25·P2
    return {
      x: 0.25 * p1.x + 0.5 * seg.cpx + 0.25 * p2.x,
      y: 0.25 * p1.y + 0.5 * seg.cpy + 0.25 * p2.y,
    };
  }
  if (seg.kind === 'C') {
    // Cubic Bezier at t=0.5: 0.125·P0 + 0.375·CP1 + 0.375·CP2 + 0.125·P3
    return {
      x: 0.125 * p1.x + 0.375 * seg.cp1x + 0.375 * seg.cp2x + 0.125 * p2.x,
      y: 0.125 * p1.y + 0.375 * seg.cp1y + 0.375 * seg.cp2y + 0.125 * p2.y,
    };
  }
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}
