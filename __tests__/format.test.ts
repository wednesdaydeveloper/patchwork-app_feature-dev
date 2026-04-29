import { formatDate } from '@/utils/format';

describe('utils/format', () => {
  test('formats date in ja locale (yyyy/MM/dd)', () => {
    expect(formatDate(new Date(2026, 0, 5), 'ja')).toBe('2026/01/05');
    expect(formatDate(new Date(2024, 11, 31), 'ja')).toBe('2024/12/31');
  });

  test('formats date in en locale (yyyy-MM-dd)', () => {
    expect(formatDate(new Date(2026, 0, 5), 'en')).toBe('2026-01-05');
    expect(formatDate(new Date(2024, 11, 31), 'en')).toBe('2024-12-31');
  });
});
