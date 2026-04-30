import React from 'react';

import { act, render } from '@testing-library/react-native';

const mockGetSize = jest.fn();

import { Image } from 'react-native';

(Image as unknown as { getSize: typeof mockGetSize }).getSize = mockGetSize;

import { useImageSize } from '@/hooks/useImageSize';

function Probe({ uri, onResult }: { uri: string | null; onResult: (size: { width: number; height: number } | null) => void }) {
  const size = useImageSize(uri);
  onResult(size);
  return null;
}

beforeEach(() => {
  mockGetSize.mockReset();
});

describe('hooks/useImageSize', () => {
  test('returns null when uri is null', () => {
    let result: { width: number; height: number } | null | undefined;
    render(<Probe uri={null} onResult={(r) => (result = r)} />);
    expect(result).toBeNull();
    expect(mockGetSize).not.toHaveBeenCalled();
  });

  test('resolves size when getSize succeeds', () => {
    mockGetSize.mockImplementation((_uri: string, ok: (w: number, h: number) => void) => ok(120, 80));
    const onResult = jest.fn();
    render(<Probe uri="file:///a.png" onResult={onResult} />);
    act(() => {});
    expect(onResult).toHaveBeenLastCalledWith({ width: 120, height: 80 });
  });

  test('keeps null when getSize errors', () => {
    mockGetSize.mockImplementation((_uri: string, _ok: unknown, fail: () => void) => fail());
    const onResult = jest.fn();
    render(<Probe uri="file:///a.png" onResult={onResult} />);
    act(() => {});
    expect(onResult).toHaveBeenLastCalledWith(null);
  });
});
