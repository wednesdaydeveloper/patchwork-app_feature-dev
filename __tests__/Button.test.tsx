import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '@/components/ui/Button';

describe('components/ui/Button', () => {
  test('renders the label', () => {
    const { getByText } = render(<Button label="Save" onPress={() => {}} />);
    expect(getByText('Save')).toBeTruthy();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" disabled onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('exposes accessibility role and disabled state', () => {
    const { getByRole } = render(<Button label="Save" disabled onPress={() => {}} />);
    const node = getByRole('button');
    expect(node.props.accessibilityState.disabled).toBe(true);
    expect(node.props.accessibilityLabel).toBe('Save');
  });
});
