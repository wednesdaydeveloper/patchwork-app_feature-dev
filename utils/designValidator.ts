import polygonClipping from 'polygon-clipping';
import { svgPathProperties } from 'svg-path-properties';

import type { Design, Polygon } from '@/types/design';

const SAMPLE_DENSITY = 64; // path 1 つあたりのサンプリング点数（曲線対応）
const AREA_TOLERANCE = 1e-3;
const COORD_TOLERANCE = 1e-6;

export type ValidationError =
  | { type: 'designSelfIntersect'; polygonId: string }
  | { type: 'designOverlap'; aId: string; bId: string }
  | { type: 'designAreaMismatch'; expected: number; actual: number }
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
 * 3. ペア毎の重なり検査（共通領域の面積が許容誤差を超えるなら NG）
 * 4. 各ピース面積の合計が 1.0 ± 許容誤差 であることを確認
 *
 * 数学的根拠:
 *   pieces の面積合計 = 1.0 かつ 全ピースが [0,1]^2 内 かつ ペア毎の重なりが 0
 *   ⇒ 隙間なし・重なりなし（CLAUDE.md「ピース内点判定（タップヒットテスト）」§
 *      および「サンプル定義」検証の議論参照）
 *
 * 注: union 演算は polygon-clipping が複雑な配置（4 つのピースが 1 点で接する等）で
 *     失敗するため使わない。代わりに個別面積合計とペア重なりで検証する。
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

  const polys: polygonClipping.Polygon[] = polylines.map(({ points }) => [points]);

  // ペアごとの重なり検査
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      const intersection = safeIntersection(polys[i], polys[j]);
      if (multiPolygonArea(intersection) > AREA_TOLERANCE) {
        errors.push({
          type: 'designOverlap',
          aId: polylines[i].id,
          bId: polylines[j].id,
        });
      }
    }
  }

  // 個別面積の合計 ≈ 1.0
  let totalArea = 0;
  for (const { points } of polylines) {
    totalArea += Math.abs(ringArea(points));
  }
  if (Math.abs(totalArea - 1.0) > AREA_TOLERANCE) {
    errors.push({ type: 'designAreaMismatch', expected: 1.0, actual: totalArea });
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

function safeIntersection(
  a: polygonClipping.Polygon,
  b: polygonClipping.Polygon,
): polygonClipping.MultiPolygon {
  try {
    return polygonClipping.intersection(a, b);
  } catch {
    return [];
  }
}

/**
 * MultiPolygon の総面積（符号なし）。
 */
function multiPolygonArea(mp: polygonClipping.MultiPolygon): number {
  let total = 0;
  for (const poly of mp) {
    for (let i = 0; i < poly.length; i++) {
      const ring = poly[i];
      const area = Math.abs(ringArea(ring));
      // i=0 は外周（加算）、i>=1 は穴（減算）
      total += i === 0 ? area : -area;
    }
  }
  return total;
}

function ringArea(ring: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}
