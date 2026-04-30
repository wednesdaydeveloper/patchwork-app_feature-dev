import React from 'react';

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PatternCanvas } from '@/components/canvas/PatternCanvas';
import type { Design } from '@/types/design';

const design: Design = {
  id: 'd',
  name: 'd',
  nameJa: 'd',
  category: '',
  gridSize: null,
  thumbnail: '',
  polygons: [
    { id: 'a', label: 'a', path: 'M 0 0 L 0.5 0 L 0.5 1 L 0 1 Z' },
    { id: 'b', label: 'b', path: 'M 0.5 0 L 1 0 L 1 1 L 0.5 1 Z' },
  ],
};

describe('components/canvas/PatternCanvas', () => {
  test('renders one path per polygon', () => {
    const tree = render(<PatternCanvas design={design} size={100} />);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('M 0 0 L 0.5 0 L 0.5 1 L 0 1 Z');
    expect(json).toContain('M 0.5 0 L 1 0 L 1 1 L 0.5 1 Z');
  });

  test('renders the per-piece overlay for each polygon', () => {
    const { getAllByText } = render(
      <PatternCanvas
        design={design}
        size={100}
        renderPieceOverlay={(polygon) => <Text>ov-{polygon.id}</Text>}
      />,
    );
    expect(getAllByText(/^ov-/)).toHaveLength(2);
  });

  test('renders the global overlay once', () => {
    const { getAllByText } = render(
      <PatternCanvas
        design={design}
        size={100}
        renderOverlay={() => <Text>global-overlay</Text>}
      />,
    );
    expect(getAllByText('global-overlay')).toHaveLength(1);
  });

  test('renders nothing extra when design has no polygons', () => {
    const empty: Design = { ...design, polygons: [] };
    const tree = render(<PatternCanvas design={empty} size={50} />);
    const json = JSON.stringify(tree.toJSON());
    expect(json).not.toContain('"d":"M');
  });
});
