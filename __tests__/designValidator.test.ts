import type { Design } from '@/types/design';
import { validateDesign } from '@/utils/designValidator';

function design(polygons: { id: string; path: string }[]): Design {
  return {
    id: 'test',
    name: 'test',
    nameJa: 'テスト',
    category: 'threeGrid',
    gridSize: null,
    thumbnail: '',
    polygons: polygons.map((p) => ({ id: p.id, label: p.id, path: p.path })),
  };
}

describe('utils/designValidator validateDesign', () => {
  test('passes for two halves filling the unit square', () => {
    const result = validateDesign(
      design([
        { id: 'l', path: 'M 0 0 L 0.5 0 L 0.5 1 L 0 1 Z' },
        { id: 'r', path: 'M 0.5 0 L 1 0 L 1 1 L 0.5 1 Z' },
      ]),
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('passes for a 2x2 grid', () => {
    const result = validateDesign(
      design([
        { id: 'tl', path: 'M 0 0 L 0.5 0 L 0.5 0.5 L 0 0.5 Z' },
        { id: 'tr', path: 'M 0.5 0 L 1 0 L 1 0.5 L 0.5 0.5 Z' },
        { id: 'bl', path: 'M 0 0.5 L 0.5 0.5 L 0.5 1 L 0 1 Z' },
        { id: 'br', path: 'M 0.5 0.5 L 1 0.5 L 1 1 L 0.5 1 Z' },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  test('flags out-of-bounds polygon', () => {
    const result = validateDesign(
      design([
        { id: 'big', path: 'M -0.1 0 L 1.1 0 L 1.1 1 L -0.1 1 Z' },
      ]),
    );
    expect(result.errors.some((e) => e.type === 'designOutOfBounds')).toBe(true);
  });

});
