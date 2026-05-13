jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  deleteDatabaseAsync: jest.fn(),
}));

import { rowToFabric } from '@/utils/db';

describe('utils/db rowToFabric', () => {
  test('builds a valid Date when created_at is a number', () => {
    const fabric = rowToFabric({
      id: 'f1',
      name: 'Cotton',
      category: '',
      image_path: '/tmp/a.png',
      px_per_mm: null,
      is_preset: 0,
      created_at: 1_714_836_300_000,
    });
    expect(fabric.createdAt).toBeInstanceOf(Date);
    expect(Number.isNaN(fabric.createdAt.getTime())).toBe(false);
    expect(fabric.createdAt.getTime()).toBe(1_714_836_300_000);
  });

  test('builds a valid Date when created_at is a numeric string', () => {
    // expo-sqlite が INTEGER を文字列で返すケースの保険。
    // `new Date("1714836300000")` 単体では Invalid Date になるため、
    // db.ts では `new Date(Number(row.created_at))` で型強制している。
    const fabric = rowToFabric({
      id: 'f1',
      name: 'Cotton',
      category: '',
      image_path: '/tmp/a.png',
      px_per_mm: null,
      is_preset: 0,
      created_at: '1714836300000' as unknown as number,
    });
    expect(Number.isNaN(fabric.createdAt.getTime())).toBe(false);
    expect(fabric.createdAt.getTime()).toBe(1_714_836_300_000);
  });
});
