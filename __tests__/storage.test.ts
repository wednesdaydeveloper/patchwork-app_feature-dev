import {
  STORAGE_BLOCK_THRESHOLD_BYTES,
  STORAGE_LOW_THRESHOLD_BYTES,
  checkStorageStatus,
} from '@/utils/storage';

const mockGetAvailableDiskSpace = jest.fn<number, []>();

jest.mock('@/utils/fileSystem', () => ({
  getAvailableDiskSpace: () => mockGetAvailableDiskSpace(),
}));

describe('utils/storage checkStorageStatus', () => {
  test('returns ok when above low threshold', () => {
    mockGetAvailableDiskSpace.mockReturnValue(STORAGE_LOW_THRESHOLD_BYTES + 1);
    expect(checkStorageStatus().status).toBe('ok');
  });

  test('returns low when between block and low thresholds', () => {
    mockGetAvailableDiskSpace.mockReturnValue(STORAGE_LOW_THRESHOLD_BYTES - 1);
    expect(checkStorageStatus().status).toBe('low');
  });

  test('returns full when below block threshold', () => {
    mockGetAvailableDiskSpace.mockReturnValue(STORAGE_BLOCK_THRESHOLD_BYTES - 1);
    expect(checkStorageStatus().status).toBe('full');
  });

  test('returns full when exactly 0', () => {
    mockGetAvailableDiskSpace.mockReturnValue(0);
    expect(checkStorageStatus().status).toBe('full');
  });

  test('availableBytes is included in the result', () => {
    mockGetAvailableDiskSpace.mockReturnValue(123_456);
    expect(checkStorageStatus().availableBytes).toBe(123_456);
  });
});
