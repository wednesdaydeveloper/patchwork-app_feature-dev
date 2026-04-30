import type { Design } from '@/types/design';
import { sampleDesignPolygons } from '@/features/editor/useSampledPolygons';

const design: Design = {
  id: 'd',
  name: 'd',
  nameJa: 'd',
  category: '',
  gridSize: null,
  thumbnail: '',
  polygons: [
    { id: 'a', label: 'a', path: 'M 0 0 L 0.5 0 L 0.5 1 L 0 1 Z' },
    { id: 'b', label: 'b', path: 'M 0.5 0 L 1 0 L 1 1 L 0.5 1 Z' },
  ],
};

describe('features/editor sampleDesignPolygons', () => {
  test('returns empty array for null design', () => {
    expect(sampleDesignPolygons(null)).toEqual([]);
  });

  test('returns one entry per polygon with sampled points and bbox', () => {
    const result = sampleDesignPolygons(design, 16);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(result[0].points.length).toBeGreaterThan(0);
    expect(result[0].bbox.minX).toBeCloseTo(0, 2);
    expect(result[0].bbox.width).toBeCloseTo(0.5, 2);
    expect(result[1].id).toBe('b');
    expect(result[1].bbox.minX).toBeCloseTo(0.5, 2);
  });
});
