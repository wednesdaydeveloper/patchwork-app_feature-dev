import { svgPathProperties } from 'svg-path-properties';

import type { Design, Polygon } from '@/types/design';

const SAMPLE_DENSITY = 64; // path 1 つあたりのサンプリング点数（曲線対応）
const COORD_TOLERANCE = 1e-6;

export type ValidationError =
  | { type: 'designSelfIntersect'; polygonId: string }
  | { type: 'designOutOfBounds'; polygonId: string };

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

/**
 * パターン定義の幾何整合性を検証する（開発時のみ実行を想定）。
 *
 * 1. 各 path をサンプリングしてポリラインに変換
 * 2. 全頂点が `[0, 1]` 範囲内であることを確認
 */
export function validateDesign(design: Design): ValidationResult {
  const errors: ValidationError[] = [];

  const polylines = design.polygons.map((p) => ({
    id: p.id,
    points: samplePolygon(p),
  }));

  for (const { id, points } of polylines) {
    if (!isWithinUnitSquare(points)) {
      errors.push({ type: 'designOutOfBounds', polygonId: id });
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * SVG path をサンプリングして閉じたポリラインに変換する。
 * 直線・曲線（C/Q/A）を含む path に対応。
 */
function samplePolygon(polygon: Polygon): [number, number][] {
  const props = new svgPathProperties(polygon.path);
  const total = props.getTotalLength();
  if (total <= 0) {
    return [];
  }
  const points: [number, number][] = [];
  for (let i = 0; i < SAMPLE_DENSITY; i++) {
    const { x, y } = props.getPointAtLength((i / SAMPLE_DENSITY) * total);
    points.push([x, y]);
  }
  // 閉じる
  if (points.length > 0) {
    const [x0, y0] = points[0];
    points.push([x0, y0]);
  }
  return points;
}

function isWithinUnitSquare(points: [number, number][]): boolean {
  const lower = -COORD_TOLERANCE;
  const upper = 1 + COORD_TOLERANCE;
  return points.every(([x, y]) => x >= lower && x <= upper && y >= lower && y <= upper);
}

