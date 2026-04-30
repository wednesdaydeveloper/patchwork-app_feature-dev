import React from 'react';

import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider, createStore } from 'jotai';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import {
  dialogQueueAtom,
  showDialogAtom,
  showToastAtom,
  toastQueueAtom,
} from '@/atoms/notification';
import { NotificationHost } from '@/components/ui/NotificationHost';

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <NotificationHost />
    </Provider>,
  );
}

describe('components/ui/NotificationHost', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows queued toasts and auto-dismisses after duration', () => {
    const store = createStore();
    const { getByText, queryByText } = renderWithStore(store);
    act(() => {
      store.set(showToastAtom, { message: 'Hi', durationMs: 1000 });
    });
    expect(getByText('Hi')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(queryByText('Hi')).toBeNull();
    expect(store.get(toastQueueAtom)).toEqual([]);
  });

  test('shows the first dialog and dismisses on action press', () => {
    const store = createStore();
    const onPress = jest.fn();
    const { getByText, queryByText } = renderWithStore(store);
    act(() => {
      store.set(showDialogAtom, {
        message: 'Confirm?',
        actions: [{ label: 'OK', onPress }],
      });
    });
    expect(getByText('Confirm?')).toBeTruthy();
    fireEvent.press(getByText('OK'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(store.get(dialogQueueAtom)).toEqual([]);
    expect(queryByText('Confirm?')).toBeNull();
  });

  test('shows only the first dialog when multiple are queued', () => {
    const store = createStore();
    const { getByText, queryByText } = renderWithStore(store);
    act(() => {
      store.set(showDialogAtom, { message: 'first' });
      store.set(showDialogAtom, { message: 'second' });
    });
    expect(getByText('first')).toBeTruthy();
    expect(queryByText('second')).toBeNull();
  });
});
