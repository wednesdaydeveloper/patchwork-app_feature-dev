import { TABLET_MIN_SHORT_EDGE_DP, classifyDevice } from '@/constants/breakpoints';

describe('classifyDevice', () => {
  test('iPhone (390x844 portrait) → phone', () => {
    expect(classifyDevice(390, 844)).toBe('phone');
  });

  test('iPhone landscape (844x390) → phone (short edge 390 < 600)', () => {
    expect(classifyDevice(844, 390)).toBe('phone');
  });

  test('iPad mini (744x1133 portrait) → tablet (short edge 744 ≥ 600)', () => {
    expect(classifyDevice(744, 1133)).toBe('tablet');
  });

  test('iPad mini landscape (1133x744) → tablet', () => {
    expect(classifyDevice(1133, 744)).toBe('tablet');
  });

  test('breakpoint boundary: short edge equals threshold → tablet', () => {
    expect(classifyDevice(TABLET_MIN_SHORT_EDGE_DP, 1024)).toBe('tablet');
  });

  test('just below threshold → phone', () => {
    expect(classifyDevice(TABLET_MIN_SHORT_EDGE_DP - 1, 1024)).toBe('phone');
  });
});
