import { createStore } from 'jotai';

import { fabricsAtom, updateFabricAtom } from '@/atoms/fabrics';
import type { FabricImage } from '@/types/fabric';

jest.mock('@/utils/db', () => ({
  updateFabric: jest.fn(async () => {}),
  insertFabric: jest.fn(async () => {}),
  isFabricReferenced: jest.fn(async () => false),
  listFabrics: jest.fn(async () => []),
  deleteFabric: jest.fn(async () => {}),
}));

jest.mock('@/utils/fileSystem', () => ({
  deleteFabricImage: jest.fn(),
}));

const sample: FabricImage = {
  id: 'f1',
  name: 'Old',
  category: 'cat-a',
  imagePath: 'file:///a.png',
  pxPerMm: null,
  createdAt: new Date(0),
};

describe('atoms/fabrics updateFabricAtom', () => {
  test('updates name and category in fabricsAtom', async () => {
    const store = createStore();
    store.set(fabricsAtom, [sample]);

    await store.set(updateFabricAtom, { id: 'f1', name: 'New', category: 'cat-b' });

    const list = store.get(fabricsAtom);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('New');
    expect(list[0].category).toBe('cat-b');
    expect(list[0].imagePath).toBe(sample.imagePath);
  });

  test('no-op when id not found', async () => {
    const store = createStore();
    store.set(fabricsAtom, [sample]);

    await store.set(updateFabricAtom, { id: 'missing', name: 'X', category: '' });

    expect(store.get(fabricsAtom)).toEqual([sample]);
  });

  test('updates pxPerMm when provided, preserves when omitted', async () => {
    const store = createStore();
    store.set(fabricsAtom, [{ ...sample, pxPerMm: 5 }]);

    // omit -> preserve
    await store.set(updateFabricAtom, { id: 'f1', name: 'Old', category: 'cat-a' });
    expect(store.get(fabricsAtom)[0].pxPerMm).toBe(5);

    // explicit value -> update
    await store.set(updateFabricAtom, { id: 'f1', name: 'Old', category: 'cat-a', pxPerMm: 7.5 });
    expect(store.get(fabricsAtom)[0].pxPerMm).toBe(7.5);

    // null -> uncalibrated
    await store.set(updateFabricAtom, { id: 'f1', name: 'Old', category: 'cat-a', pxPerMm: null });
    expect(store.get(fabricsAtom)[0].pxPerMm).toBeNull();
  });
});
