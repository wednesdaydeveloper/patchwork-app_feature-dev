import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { Dialog } from '@/components/ui/Dialog';

describe('components/ui/Dialog', () => {
  test('renders title and message when visible', () => {
    const { getByText } = render(
      <Dialog visible title="Confirm" message="Are you sure?" />,
    );
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Are you sure?')).toBeTruthy();
  });

  test('renders a default OK action when none given', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <Dialog visible message="Hello" onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText('common.ok'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders provided actions and dispatches their onPress', () => {
    const a = jest.fn();
    const b = jest.fn();
    const { getByText } = render(
      <Dialog
        visible
        message="Choose"
        actions={[
          { label: 'Cancel', variant: 'secondary', onPress: a },
          { label: 'Delete', variant: 'danger', onPress: b },
        ]}
      />,
    );
    fireEvent.press(getByText('Delete'));
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
    fireEvent.press(getByText('Cancel'));
    expect(a).toHaveBeenCalledTimes(1);
  });
});
