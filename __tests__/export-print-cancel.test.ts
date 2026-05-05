import { isUserCancelledPrint } from '@/features/export/printErrors';

describe('features/export/printErrors isUserCancelledPrint', () => {
  test('returns true for ERR_PRINT_INCOMPLETE error', () => {
    const error = Object.assign(new Error('Printing did not complete'), {
      code: 'ERR_PRINT_INCOMPLETE',
    });
    expect(isUserCancelledPrint(error)).toBe(true);
  });

  test('returns false for other Error codes', () => {
    const error = Object.assign(new Error('Out of memory'), {
      code: 'ERR_OUT_OF_MEMORY',
    });
    expect(isUserCancelledPrint(error)).toBe(false);
  });

  test('returns false for Error without code property', () => {
    expect(isUserCancelledPrint(new Error('plain error'))).toBe(false);
  });

  test('returns false for non-Error values', () => {
    expect(isUserCancelledPrint('string')).toBe(false);
    expect(isUserCancelledPrint(null)).toBe(false);
    expect(isUserCancelledPrint(undefined)).toBe(false);
    // 純粋オブジェクトは instanceof Error が false なので保護される
    expect(isUserCancelledPrint({ code: 'ERR_PRINT_INCOMPLETE' })).toBe(false);
  });
});
