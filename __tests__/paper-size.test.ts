import { getPaperPrintableSquareMm } from '@/features/export/paperSize';

describe('getPaperPrintableSquareMm', () => {
  test('A4 returns short side - 2*10mm margin (≈190mm)', () => {
    const mm = getPaperPrintableSquareMm('A4');
    // A4 short side = 595 pt * 25.4/72 ≈ 209.97 mm; minus 20 mm margin
    expect(mm).toBeGreaterThan(189);
    expect(mm).toBeLessThan(191);
  });

  test('A3 is larger than A4 printable area', () => {
    expect(getPaperPrintableSquareMm('A3')).toBeGreaterThan(
      getPaperPrintableSquareMm('A4'),
    );
  });

  test('Letter has its own printable square', () => {
    const mm = getPaperPrintableSquareMm('Letter');
    // Letter short side = 612 pt * 25.4/72 ≈ 215.9 mm; minus 20 mm margin
    expect(mm).toBeGreaterThan(195);
    expect(mm).toBeLessThan(196);
  });
});
