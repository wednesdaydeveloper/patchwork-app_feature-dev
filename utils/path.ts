import { svgPathProperties } from 'svg-path-properties';

export interface Point {
  x: number;
  y: number;
}

export interface Bbox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const DEFAULT_SAMPLES = 64;

/**
 * SVG path を等間隔サンプリングして近似ポリラインを返す。
 * 直線・曲線・円弧を含む path に対して bbox 計算と内外判定を行うために使う。
 */
export function samplePath(path: string, samples: number = DEFAULT_SAMPLES): Point[] {
  const props = new svgPathProperties(path);
  const total = props.getTotalLength();
  if (total <= 0) {
    return [];
  }
  const points: Point[] = [];
  const step = total / samples;
  for (let i = 0; i <= samples; i += 1) {
    const p = props.getPointAtLength(Math.min(i * step, total));
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

/**
 * サンプリング点群から bbox を計算する。
 */
export function computeBbox(points: readonly Point[]): Bbox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/**
 * SVG path の bbox を直接計算する（サンプリングを内包）。
 */
export function pathBbox(path: string, samples: number = DEFAULT_SAMPLES): Bbox {
  return computeBbox(samplePath(path, samples));
}

/**
 * Ray casting による点の内外判定（凹多角形対応）。
 * 近似ポリラインに対して使う。
 */
export function isPointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersect =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + Number.EPSILON) + a.x;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * SVG path の点が内部にあるかを判定する。
 */
export function isPointInPath(point: Point, path: string, samples: number = DEFAULT_SAMPLES): boolean {
  return isPointInPolygon(point, samplePath(path, samples));
}
