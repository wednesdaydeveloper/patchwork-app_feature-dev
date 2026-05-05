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
import { buildSvgString } from '@/features/export/buildSvg';

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

describe('features/export buildSvgString', () => {
  test('produces standalone SVG with xmlns and xml prelude', async () => {
    const svg = await buildSvgString({ work, design, fabrics: [fabric], standalone: true });
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="150mm"');
    expect(svg).toContain('viewBox="0 0 1 1"');
    expect(svg).toContain('data:image/png;base64,BASE64DATA');
  });

  test('embedded mode (standalone=false) omits xmlns and prelude', async () => {
    const svg = await buildSvgString({ work, design, fabrics: [fabric] });
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg).not.toContain('<?xml');
    expect(svg).not.toContain('xmlns=');
  });

  test('escapes special characters in path ids', async () => {
    const evilDesign: Design = {
      ...design,
      polygons: [
        { id: 'a&b<c>', label: 'x', path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z' },
      ],
    };
    const evilWork: Work = { ...work, pieceSettings: [] };
    const svg = await buildSvgString({ work: evilWork, design: evilDesign, fabrics: [] });
    expect(svg).toContain('clip-a&amp;b&lt;c&gt;');
    expect(svg).not.toContain('a&b<c>');
  });

  test('uses real-scale formula when fabric has pxPerMm', async () => {
    const calibrated: FabricImage = { ...fabric, pxPerMm: 10 };
    const svg = await buildSvgString({ work, design, fabrics: [calibrated] });
    // drawScalePerPx = 1 / (10 * 150) = 0.000666...
    expect(svg).toMatch(/scale\(0\.000666/);
  });

  test('respects effectiveSizeMm override', async () => {
    const svg = await buildSvgString({
      work,
      design,
      fabrics: [fabric],
      effectiveSizeMm: 80,
      standalone: true,
    });
    expect(svg).toContain('width="80mm"');
  });
});
