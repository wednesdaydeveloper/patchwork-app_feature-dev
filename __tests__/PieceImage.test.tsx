import React from 'react';

import { render } from '@testing-library/react-native';
import { Image as RNImage } from 'react-native';
import { Svg } from 'react-native-svg';

(RNImage as unknown as { getSize: jest.Mock }).getSize = jest.fn(
  (_uri: string, ok: (w: number, h: number) => void) => ok(200, 100),
);

import { PieceImage } from '@/components/canvas/PieceImage';

const bbox = { minX: 0.25, minY: 0.25, width: 0.5, height: 0.5 };

function renderInSvg(node: React.ReactNode) {
  return render(<Svg viewBox="0 0 1 1">{node}</Svg>);
}

interface ImageProps {
  matrix?: number[];
  width?: number;
  height?: number;
}

/**
 * Walk the rendered tree and return the props of the first RNSVGImage node.
 * react-native-svg converts SVG transform strings into a flat 6-element
 * matrix [a, b, c, d, e, f] representing:
 *   [ a c e ]
 *   [ b d f ]
 *   [ 0 0 1 ]
 */
function findImageProps(json: unknown): ImageProps | null {
  if (!json || typeof json !== 'object') return null;
  const node = json as { type?: string; props?: ImageProps; children?: unknown[] };
  if (node.type === 'RNSVGImage' && node.props) return node.props;
  for (const child of node.children ?? []) {
    const found = findImageProps(child);
    if (found) return found;
  }
  return null;
}

function imageProps(tree: ReturnType<typeof render>): ImageProps {
  const props = findImageProps(tree.toJSON());
  if (!props) throw new Error('RNSVGImage not found in tree');
  return props;
}

describe('components/canvas/PieceImage', () => {
  test('uses cover-fit scale when pxPerMm is missing', () => {
    const tree = renderInSvg(
      <PieceImage imageUri="file:///a.png" bbox={bbox} offsetX={0} offsetY={0} />,
    );
    const props = imageProps(tree);
    // image 200x100, bbox 0.5x0.5 → drawScale = max(0.5/200, 0.5/100) = 0.005
    // center = (0.5, 0.5), translation after pre-translate(-100, -50): (0, 0.25)
    expect(props.matrix?.[0]).toBeCloseTo(0.005);
    expect(props.matrix?.[3]).toBeCloseTo(0.005);
    expect(props.matrix?.[1]).toBeCloseTo(0);
    expect(props.matrix?.[2]).toBeCloseTo(0);
    expect(props.matrix?.[4]).toBeCloseTo(0);
    expect(props.matrix?.[5]).toBeCloseTo(0.25);
    expect(props.width).toBe(200);
    expect(props.height).toBe(100);
  });

  test('uses real-scale formula when pxPerMm and sizeMm are provided', () => {
    const tree = renderInSvg(
      <PieceImage
        imageUri="file:///a.png"
        bbox={bbox}
        offsetX={0}
        offsetY={0}
        pxPerMm={10}
        sizeMm={150}
      />,
    );
    const props = imageProps(tree);
    // drawScale = 1 / (10 * 150) = 1/1500 ≈ 0.0006667
    expect(props.matrix?.[0]).toBeCloseTo(1 / 1500, 5);
    expect(props.matrix?.[3]).toBeCloseTo(1 / 1500, 5);
  });

  test('applies offsetX / offsetY to the translation component', () => {
    const tree = renderInSvg(
      <PieceImage imageUri="file:///a.png" bbox={bbox} offsetX={0.5} offsetY={-0.25} />,
    );
    // centerX = 0.25 + 0.5 * (0.5 + 0.5) = 0.75
    // centerY = 0.25 + 0.5 * (0.5 - 0.25) = 0.375
    // matrix translation = center + (-size/2 * scale) = (0.75-0.5, 0.375-0.25) = (0.25, 0.125)
    const props = imageProps(tree);
    expect(props.matrix?.[4]).toBeCloseTo(0.25);
    expect(props.matrix?.[5]).toBeCloseTo(0.125);
  });

  test('rotation in radians applies to matrix (90deg flips a/d into b/c)', () => {
    const tree = renderInSvg(
      <PieceImage
        imageUri="file:///a.png"
        bbox={bbox}
        offsetX={0}
        offsetY={0}
        rotation={Math.PI / 2}
      />,
    );
    const props = imageProps(tree);
    // 90deg rotation + scale s → matrix:
    //   a = s*cos = 0, b = s*sin = s, c = -s*sin = -s, d = s*cos = 0
    expect(props.matrix?.[0]).toBeCloseTo(0, 6);
    expect(props.matrix?.[1]).toBeCloseTo(0.005, 6);
    expect(props.matrix?.[2]).toBeCloseTo(-0.005, 6);
    expect(props.matrix?.[3]).toBeCloseTo(0, 6);
  });

  test('renders nothing when image size resolves to 0x0', () => {
    (RNImage as unknown as { getSize: jest.Mock }).getSize = jest.fn(
      (_uri: string, ok: (w: number, h: number) => void) => ok(0, 0),
    );
    const tree = renderInSvg(
      <PieceImage imageUri="file:///a.png" bbox={bbox} offsetX={0} offsetY={0} />,
    );
    expect(findImageProps(tree.toJSON())).toBeNull();
  });
});
