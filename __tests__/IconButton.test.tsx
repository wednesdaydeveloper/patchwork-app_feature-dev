import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import { IconButton } from '@/components/ui/IconButton';

describe('components/ui/IconButton', () => {
  test('renders the icon and accessibility label', () => {
    const { getByText, getByRole } = render(
      <IconButton icon="✕" accessibilityLabel="Close" onPress={() => {}} />,
    );
    expect(getByText('✕')).toBeTruthy();
    expect(getByRole('button').props.accessibilityLabel).toBe('Close');
  });

  test('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <IconButton icon="+" accessibilityLabel="Add" onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <IconButton icon="+" accessibilityLabel="Add" disabled onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(getByRole('button').props.accessibilityState.disabled).toBe(true);
  });
});
