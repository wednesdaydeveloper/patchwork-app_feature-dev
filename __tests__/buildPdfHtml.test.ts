jest.mock('react-native', () => ({
  Image: {
    getSize: (
      _uri: string,
      onSuccess: (w: number, h: number) => void,
    ) => onSuccess(100, 50),
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(async () => 'BASE64DATA'),
}));

import type { Design } from '@/types/design';
import type { FabricImage } from '@/types/fabric';
import type { Work } from '@/types/work';
import { buildPdfHtml } from '@/features/export/buildPdfHtml';

const design: Design = {
  id: 'd1',
  name: 'Two<Halves>',
  nameJa: '2分割',
  category: 'twoGrid',
  gridSize: null,
  thumbnail: '',
  polygons: [
    { id: 'l', label: 'left', path: 'M 0 0 L 0.5 0 L 0.5 1 L 0 1 Z' },
    { id: 'r', label: 'right', path: 'M 0.5 0 L 1 0 L 1 1 L 0.5 1 Z' },
  ],
};

const fabric: FabricImage = {
  id: 'f1',
  name: 'cotton',
  category: '',
  imagePath: 'file:///fabric.png',
  pxPerMm: null,
  createdAt: new Date(0),
};

const work: Work = {
  id: 'w1',
  name: 'My "Work" & Co',
  designId: 'd1',
  sizeMm: 150,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  pieceSettings: [
    { polygonId: 'l', fabricImageId: 'f1', offsetX: 0, offsetY: 0, rotation: 0 },
  ],
};

describe('features/export buildPdfHtml', () => {
  test('produces a valid HTML doc with svg and embeds image as data URI', async () => {
    const html = await buildPdfHtml({
      work,
      design,
      fabrics: [fabric],
      paperSize: 'A4',
      scaleNote: 'scale 1:1',
    });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 1 1"');
    expect(html).toContain('data:image/png;base64,BASE64DATA');
    expect(html).toContain('clipPath');
    expect(html).toContain('scale 1:1');
  });

  test('escapes HTML-special characters in work name and design name', async () => {
    const html = await buildPdfHtml({
      work,
      design,
      fabrics: [fabric],
      paperSize: 'A4',
      scaleNote: '',
    });
    expect(html).toContain('My &quot;Work&quot; &amp; Co');
    expect(html).toContain('Two&lt;Halves&gt;');
  });

  test('uses effectiveSizeMm when provided', async () => {
    const html = await buildPdfHtml({
      work,
      design,
      fabrics: [fabric],
      paperSize: 'A4',
      scaleNote: '',
      effectiveSizeMm: 80,
    });
    expect(html).toContain('width="80mm"');
    expect(html).toContain('height="80mm"');
  });

  test('renders pieces without setting as plain white path', async () => {
    const html = await buildPdfHtml({
      work: { ...work, pieceSettings: [] },
      design,
      fabrics: [fabric],
      paperSize: 'A4',
      scaleNote: '',
    });
    expect(html).toContain('fill="#ffffff"');
    expect(html).not.toContain('data:image');
  });

  test('uses real-scale formula when fabric has pxPerMm', async () => {
    const calibrated: FabricImage = { ...fabric, pxPerMm: 10 };
    const html = await buildPdfHtml({
      work,
      design,
      fabrics: [calibrated],
      paperSize: 'A4',
      scaleNote: '',
    });
    // drawScalePerPx = 1 / (10 * 150) = 0.0006666...
    expect(html).toMatch(/scale\(0\.000666/);
  });
});
