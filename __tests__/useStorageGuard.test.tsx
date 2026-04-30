import React from 'react';

import { Provider, createStore } from 'jotai';
import { act, render } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockCheckStorage = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/utils/storage', () => ({
  checkStorageStatus: () => mockCheckStorage(),
}));

import { dialogQueueAtom } from '@/atoms/notification';
import { useStorageGuard } from '@/hooks/useStorageGuard';

interface ProbeProps {
  onResult: (run: () => Promise<boolean>) => void;
}

function Probe({ onResult }: ProbeProps) {
  const guard = useStorageGuard();
  onResult(guard);
  return null;
}

function setup() {
  const store = createStore();
  let runner!: () => Promise<boolean>;
  render(
    <Provider store={store}>
      <Probe onResult={(g) => (runner = g)} />
    </Provider>,
  );
  return { store, run: () => runner() };
}

beforeEach(() => {
  mockReplace.mockClear();
  mockCheckStorage.mockReset();
});

describe('hooks/useStorageGuard', () => {
  test('returns true immediately when status is ok', async () => {
    mockCheckStorage.mockReturnValue({ status: 'ok', availableBytes: 9999999 });
    const { store, run } = setup();
    const result = await run();
    expect(result).toBe(true);
    expect(store.get(dialogQueueAtom)).toEqual([]);
  });

  test('shows full dialog and resolves false when user picks home', async () => {
    mockCheckStorage.mockReturnValue({ status: 'full', availableBytes: 0 });
    const { store, run } = setup();
    const promise = run();
    // dialog enqueued
    const dialog = store.get(dialogQueueAtom)[0];
    expect(dialog).toBeDefined();
    expect(dialog.actions?.length).toBe(2);
    // press the home action
    act(() => {
      dialog.actions![0].onPress();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
    await expect(promise).resolves.toBe(false);
  });

  test('low: ok action resolves true, cancel resolves false', async () => {
    mockCheckStorage.mockReturnValue({ status: 'low', availableBytes: 1 });
    const { store, run } = setup();
    const promise = run();
    const dialog = store.get(dialogQueueAtom)[0];
    act(() => {
      dialog.actions![0].onPress();
    });
    await expect(promise).resolves.toBe(true);

    // second invocation, hit cancel
    mockCheckStorage.mockReturnValue({ status: 'low', availableBytes: 1 });
    const promise2 = run();
    const dialog2 = store.get(dialogQueueAtom).slice(-1)[0];
    act(() => {
      dialog2.actions![1].onPress();
    });
    await expect(promise2).resolves.toBe(false);
  });
});
