import {
  defaultFabricName,
  generateFabricId,
  resolveFabricMeta,
} from '@/features/fabrics/fabricRegisterHelpers';

describe('features/fabrics useFabricRegister helpers', () => {
  test('generateFabricId formats id with timestamp and random suffix', () => {
    const id = generateFabricId(1234567890, 0.123456789);
    expect(id).toMatch(/^fab_1234567890_/);
    expect(id.length).toBeGreaterThan('fab_1234567890_'.length);
  });

  test('generateFabricId produces stable output for the same inputs', () => {
    expect(generateFabricId(1, 0.5)).toBe(generateFabricId(1, 0.5));
  });

  test('defaultFabricName formats yyyymmddhhmmss with zero padding', () => {
    const d = new Date(2026, 0, 5, 9, 7, 3); // 2026-01-05 09:07:03
    expect(defaultFabricName(d)).toBe('20260105090703');
  });

  test('resolveFabricMeta trims inputs', () => {
    expect(resolveFabricMeta('  hello  ', '  cat  ')).toEqual({
      name: 'hello',
      category: 'cat',
    });
  });

  test('resolveFabricMeta uses default name when name is blank', () => {
    const result = resolveFabricMeta('   ', 'cat');
    expect(result.name).toMatch(/^\d{14}$/);
    expect(result.category).toBe('cat');
  });
});
