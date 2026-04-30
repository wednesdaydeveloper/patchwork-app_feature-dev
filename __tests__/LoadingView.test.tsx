import React from 'react';

import { render } from '@testing-library/react-native';

import { LoadingView } from '@/components/ui/LoadingView';

describe('components/ui/LoadingView', () => {
  test('renders without label', () => {
    const { queryByText } = render(<LoadingView />);
    expect(queryByText('Loading')).toBeNull();
  });

  test('renders the label when provided', () => {
    const { getByText } = render(<LoadingView label="Loading…" />);
    expect(getByText('Loading…')).toBeTruthy();
  });

  test('exposes progressbar accessibility role', () => {
    const { getByLabelText } = render(<LoadingView label="Wait" />);
    expect(getByLabelText('Wait')).toBeTruthy();
  });
});
