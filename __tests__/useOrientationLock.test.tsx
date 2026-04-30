import React from 'react';

import { render } from '@testing-library/react-native';

const mockLockAsync = jest.fn(async (..._args: unknown[]) => {});
const mockUseDeviceSize = jest.fn();

jest.mock('expo-screen-orientation', () => ({
  __esModule: true,
  lockAsync: (...args: unknown[]) => mockLockAsync(...args),
  OrientationLock: { LANDSCAPE: 'LANDSCAPE', PORTRAIT_UP: 'PORTRAIT_UP' },
}));

jest.mock('@/hooks/useDeviceSize', () => ({
  useDeviceSize: () => mockUseDeviceSize(),
}));

import { useOrientationLock } from '@/hooks/useOrientationLock';

function Host() {
  useOrientationLock();
  return null;
}

beforeEach(() => {
  mockLockAsync.mockClear();
});

describe('hooks/useOrientationLock', () => {
  test('locks to PORTRAIT_UP for phone', () => {
    mockUseDeviceSize.mockReturnValue({ kind: 'phone', width: 360, height: 800, isLandscape: false });
    render(<Host />);
    expect(mockLockAsync).toHaveBeenCalledWith('PORTRAIT_UP');
  });

  test('locks to LANDSCAPE for tablet', () => {
    mockUseDeviceSize.mockReturnValue({ kind: 'tablet', width: 1024, height: 768, isLandscape: true });
    render(<Host />);
    expect(mockLockAsync).toHaveBeenCalledWith('LANDSCAPE');
  });
});
