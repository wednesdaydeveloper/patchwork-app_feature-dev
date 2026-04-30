import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import { Toast } from '@/components/ui/Toast';

describe('components/ui/Toast', () => {
  test('renders the message', () => {
    const { getByText } = render(<Toast message="Saved" variant="success" />);
    expect(getByText('Saved')).toBeTruthy();
  });

  test('does not render an action button when actionLabel is missing', () => {
    const { queryByRole } = render(<Toast message="Saved" variant="info" />);
    expect(queryByRole('button')).toBeNull();
  });

  test('renders action button and fires onAction when tapped', () => {
    const onAction = jest.fn();
    const { getByRole } = render(
      <Toast message="Failed" variant="error" actionLabel="Retry" onAction={onAction} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('omits action button when actionLabel given without onAction', () => {
    const { queryByRole } = render(
      <Toast message="Failed" variant="error" actionLabel="Retry" />,
    );
    expect(queryByRole('button')).toBeNull();
  });
});
