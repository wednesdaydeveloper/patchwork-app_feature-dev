import React from 'react';

import { render } from '@testing-library/react-native';
import { Svg } from 'react-native-svg';

import { Piece } from '@/components/canvas/Piece';

const polygon = { id: 'p', label: 'p', path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z' };

describe('components/canvas/Piece', () => {
  test('renders the polygon path', () => {
    const tree = render(
      <Svg viewBox="0 0 1 1">
        <Piece polygon={polygon} fill="#abcdef" />
      </Svg>,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain(polygon.path);
  });

  test('scales strokeWidth by the scale factor', () => {
    const tree = render(
      <Svg viewBox="0 0 1 1">
        <Piece polygon={polygon} strokeWidth={0.01} scale={10} />
      </Svg>,
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('"strokeWidth":0.1');
  });
});
