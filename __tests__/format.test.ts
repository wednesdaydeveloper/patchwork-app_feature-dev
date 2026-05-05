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

  test('returns "-" for Invalid Date', () => {
    expect(formatDate(new Date(NaN), 'en')).toBe('-');
    expect(formatDate(new Date(NaN), 'ja')).toBe('-');
  });

  test('returns "-" when given a numeric string via new Date', () => {
    // `new Date("1714836300000")` は ISO/RFC 形式でないため Invalid Date になる。
    // expo-sqlite が INTEGER を文字列で返したとき NaN が UI に露出しないことの保証。
    expect(formatDate(new Date('1714836300000'), 'en')).toBe('-');
  });

  test('returns "-" when given a non-Date value (defensive)', () => {
    // 型としては Date を要求するが、JS 側からの想定外入力に対する保険。
    expect(formatDate(undefined as unknown as Date, 'en')).toBe('-');
    expect(formatDate(null as unknown as Date, 'en')).toBe('-');
    expect(formatDate('2024-01-01' as unknown as Date, 'en')).toBe('-');
  });
});
