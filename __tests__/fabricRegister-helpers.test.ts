import {
  FABRIC_MULTI_PICK_LIMIT,
  bulkFabricName,
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

  test('bulkFabricName combines prefix with zero-padded index', () => {
    expect(bulkFabricName('cotton', 1, 5)).toBe('cotton01');
    expect(bulkFabricName('cotton', 12, 12)).toBe('cotton12');
  });

  test('bulkFabricName widens the suffix for >= 100 items', () => {
    expect(bulkFabricName('p', 7, 100)).toBe('p007');
  });

  test('bulkFabricName falls back to default name when prefix is blank', () => {
    const name = bulkFabricName('   ', 1, 3);
    expect(name).toMatch(/^\d{14}01$/);
  });

  test('FABRIC_MULTI_PICK_LIMIT is exposed (10 per spec)', () => {
    expect(FABRIC_MULTI_PICK_LIMIT).toBe(10);
  });
});
