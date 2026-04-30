import { computeBbox, isPointInPath, isPointInPolygon, pathBbox, samplePath } from '@/utils/path';

describe('utils/path', () => {
  test('samplePath returns points along a closed square', () => {
    const points = samplePath('M 0 0 L 1 0 L 1 1 L 0 1 Z', 16);
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(-0.001);
      expect(p.x).toBeLessThanOrEqual(1.001);
      expect(p.y).toBeGreaterThanOrEqual(-0.001);
      expect(p.y).toBeLessThanOrEqual(1.001);
    }
  });

  test('computeBbox returns the enclosing rectangle of points', () => {
    const bbox = computeBbox([
      { x: 0.2, y: 0.3 },
      { x: 0.8, y: 0.5 },
      { x: 0.4, y: 0.9 },
    ]);
    expect(bbox.minX).toBeCloseTo(0.2);
    expect(bbox.minY).toBeCloseTo(0.3);
    expect(bbox.width).toBeCloseTo(0.6);
    expect(bbox.height).toBeCloseTo(0.6);
  });

  test('pathBbox of a unit square is approximately 0..1', () => {
    const bbox = pathBbox('M 0 0 L 1 0 L 1 1 L 0 1 Z');
    expect(bbox.minX).toBeCloseTo(0, 2);
    expect(bbox.minY).toBeCloseTo(0, 2);
    expect(bbox.width).toBeCloseTo(1, 2);
    expect(bbox.height).toBeCloseTo(1, 2);
  });

  test('isPointInPolygon detects inside / outside on a square', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(isPointInPolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 1.5, y: 0.5 }, square)).toBe(false);
    expect(isPointInPolygon({ x: -0.1, y: 0.5 }, square)).toBe(false);
  });

  test('samplePath returns empty array for a zero-length path', () => {
    expect(samplePath('M 0 0')).toEqual([]);
  });

  test('computeBbox returns a zero rectangle for empty input', () => {
    expect(computeBbox([])).toEqual({ minX: 0, minY: 0, width: 0, height: 0 });
  });

  test('isPointInPolygon returns false for fewer than 3 vertices', () => {
    expect(isPointInPolygon({ x: 0, y: 0 }, [])).toBe(false);
    expect(isPointInPolygon({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  });

  test('isPointInPath delegates to sampling + ray casting', () => {
    const square = 'M 0 0 L 1 0 L 1 1 L 0 1 Z';
    expect(isPointInPath({ x: 0.5, y: 0.5 }, square)).toBe(true);
    expect(isPointInPath({ x: 1.5, y: 0.5 }, square)).toBe(false);
  });

  test('isPointInPolygon handles a concave polygon (L shape)', () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 1 },
      { x: 0, y: 1 },
    ];
    // 内側
    expect(isPointInPolygon({ x: 0.25, y: 0.25 }, lShape)).toBe(true);
    expect(isPointInPolygon({ x: 0.25, y: 0.75 }, lShape)).toBe(true);
    // 凹みの部分（外）
    expect(isPointInPolygon({ x: 0.75, y: 0.75 }, lShape)).toBe(false);
  });
});
