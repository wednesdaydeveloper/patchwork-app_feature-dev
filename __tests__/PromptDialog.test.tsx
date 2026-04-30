import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { PromptDialog } from '@/components/ui/PromptDialog';

describe('components/ui/PromptDialog', () => {
  test('renders title, fields with initial values, and submits typed values', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <PromptDialog
        visible
        title="Rename"
        fields={[{ key: 'name', placeholder: 'Name', initialValue: 'Old' }]}
        submitLabel="OK"
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    const input = getByPlaceholderText('Name');
    expect(input.props.value).toBe('Old');
    fireEvent.changeText(input, 'New');
    fireEvent.press(getByText('OK'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'New' });
  });

  test('disables submit when a required field is blank, enables after typing', () => {
    const onSubmit = jest.fn();
    const fields = [{ key: 'q', placeholder: 'Query', required: true }];
    const { getByLabelText, getByPlaceholderText } = render(
      <PromptDialog
        visible
        title="Pick"
        fields={fields}
        submitLabel="Go"
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    expect(getByLabelText('Go').props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(getByPlaceholderText('Query'), 'cats');
    expect(getByLabelText('Go').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByLabelText('Go'));
    expect(onSubmit).toHaveBeenCalledWith({ q: 'cats' });
  });

  test('calls onCancel from the cancel button', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <PromptDialog
        visible
        title="Title"
        fields={[]}
        onSubmit={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('common.cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('renders extraAction and dispatches its onPress', () => {
    const extra = jest.fn();
    const { getByText } = render(
      <PromptDialog
        visible
        title="T"
        fields={[]}
        onSubmit={() => {}}
        onCancel={() => {}}
        extraAction={{ label: 'Re-do', onPress: extra }}
      />,
    );
    fireEvent.press(getByText('Re-do'));
    expect(extra).toHaveBeenCalledTimes(1);
  });
});
