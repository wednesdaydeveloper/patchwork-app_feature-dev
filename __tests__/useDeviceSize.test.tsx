import React from 'react';

import { render } from '@testing-library/react-native';

const mockDimensions = jest.fn();

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDimensions(),
}));

import { useDeviceSize } from '@/hooks/useDeviceSize';

function Probe({ onResult }: { onResult: (size: ReturnType<typeof useDeviceSize>) => void }) {
  const size = useDeviceSize();
  onResult(size);
  return null;
}

describe('hooks/useDeviceSize', () => {
  test('classifies a small phone in portrait as phone / portrait', () => {
    mockDimensions.mockReturnValue({ width: 360, height: 800 });
    let result: ReturnType<typeof useDeviceSize> | null = null;
    render(<Probe onResult={(r) => (result = r)} />);
    expect(result).toEqual({
      kind: 'phone',
      width: 360,
      height: 800,
      isLandscape: false,
    });
  });

  test('classifies a tablet in landscape', () => {
    mockDimensions.mockReturnValue({ width: 1024, height: 768 });
    let result: ReturnType<typeof useDeviceSize> | null = null;
    render(<Probe onResult={(r) => (result = r)} />);
    expect(result).toEqual({
      kind: 'tablet',
      width: 1024,
      height: 768,
      isLandscape: true,
    });
  });
});
