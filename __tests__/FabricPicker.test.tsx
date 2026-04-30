import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { FabricPicker } from '@/components/fabric/FabricPicker';
import type { FabricImage } from '@/types/fabric';

function fabric(id: string, name: string): FabricImage {
  return {
    id,
    name,
    category: '',
    imagePath: `file:///${id}.png`,
    pxPerMm: null,
    createdAt: new Date(0),
  };
}

describe('components/fabric/FabricPicker', () => {
  test('shows empty message and triggers onAddFabric when no fabrics', () => {
    const onAddFabric = jest.fn();
    const { getByText } = render(
      <FabricPicker
        fabrics={[]}
        selectedFabricId={null}
        onSelect={() => {}}
        onAddFabric={onAddFabric}
      />,
    );
    expect(getByText('fabrics.empty')).toBeTruthy();
    fireEvent.press(getByText('home.fabrics'));
    expect(onAddFabric).toHaveBeenCalledTimes(1);
  });

  test('renders fabric items and dispatches onSelect with the tapped fabric', () => {
    const onSelect = jest.fn();
    const items = [fabric('a', 'cotton'), fabric('b', 'denim')];
    const { getByLabelText } = render(
      <FabricPicker
        fabrics={items}
        selectedFabricId={null}
        onSelect={onSelect}
        onAddFabric={() => {}}
      />,
    );
    fireEvent.press(getByLabelText('denim'));
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });

  test('marks selected item with accessibilityState.selected', () => {
    const items = [fabric('a', 'cotton'), fabric('b', 'denim')];
    const { getByLabelText } = render(
      <FabricPicker
        fabrics={items}
        selectedFabricId="b"
        onSelect={() => {}}
        onAddFabric={() => {}}
      />,
    );
    expect(getByLabelText('denim').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('cotton').props.accessibilityState.selected).toBe(false);
  });
});
