import type { Design } from '@/types/design';
import { getDesignName } from '@/hooks/useDesignName';

const sample: Design = {
  id: 'd1',
  name: 'Nine Patch',
  nameJa: 'ナインパッチ',
  category: 'threeGrid',
  gridSize: 3,
  thumbnail: '',
  polygons: [],
};

describe('hooks/useDesignName getDesignName', () => {
  test('returns Japanese name when language is ja', () => {
    expect(getDesignName(sample, 'ja')).toBe('ナインパッチ');
  });

  test('returns English name when language is en', () => {
    expect(getDesignName(sample, 'en')).toBe('Nine Patch');
  });

  test('returns English name as fallback for unknown languages', () => {
    expect(getDesignName(sample, 'fr')).toBe('Nine Patch');
  });

  test('returns English name for empty language string', () => {
    expect(getDesignName(sample, '')).toBe('Nine Patch');
  });
});
