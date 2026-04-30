import { createStore } from 'jotai';

import {
  addFabricAtom,
  fabricsAtom,
  fabricsByCategoryAtom,
  fabricsLoadedAtom,
  loadFabricsAtom,
  removeFabricAtom,
} from '@/atoms/fabrics';
import type { FabricImage } from '@/types/fabric';

const mockListFabrics = jest.fn<Promise<FabricImage[]>, []>();
const mockInsertFabric = jest.fn(async (_f: FabricImage) => {});
const mockDeleteFabric = jest.fn(async (_id: string) => {});
const mockIsFabricReferenced = jest.fn<Promise<boolean>, [string]>();
const mockDeleteFabricImage = jest.fn();

jest.mock('@/utils/db', () => ({
  listFabrics: () => mockListFabrics(),
  insertFabric: (f: FabricImage) => mockInsertFabric(f),
  deleteFabric: (id: string) => mockDeleteFabric(id),
  isFabricReferenced: (id: string) => mockIsFabricReferenced(id),
  updateFabric: jest.fn(async () => {}),
}));

jest.mock('@/utils/fileSystem', () => ({
  deleteFabricImage: (uri: string) => mockDeleteFabricImage(uri),
}));

function makeFabric(id: string, category: string): FabricImage {
  return {
    id,
    name: `name-${id}`,
    category,
    imagePath: `file:///${id}.png`,
    pxPerMm: null,
    createdAt: new Date(0),
  };
}

beforeEach(() => {
  mockListFabrics.mockReset();
  mockInsertFabric.mockClear();
  mockDeleteFabric.mockClear();
  mockIsFabricReferenced.mockReset();
  mockDeleteFabricImage.mockClear();
});

describe('atoms/fabrics', () => {
  test('loadFabricsAtom populates and sets loaded flag', async () => {
    const data = [makeFabric('a', ''), makeFabric('b', 'cat')];
    mockListFabrics.mockResolvedValue(data);
    const store = createStore();
    await store.set(loadFabricsAtom);
    expect(store.get(fabricsAtom)).toEqual(data);
    expect(store.get(fabricsLoadedAtom)).toBe(true);
  });

  test('loadFabricsAtom sets loaded flag even on failure', async () => {
    mockListFabrics.mockRejectedValue(new Error('db'));
    const store = createStore();
    await expect(store.set(loadFabricsAtom)).rejects.toThrow('db');
    expect(store.get(fabricsLoadedAtom)).toBe(true);
  });

  test('addFabricAtom prepends fabric and inserts via DB', async () => {
    const store = createStore();
    store.set(fabricsAtom, [makeFabric('a', '')]);
    const fresh = makeFabric('b', 'cat');
    await store.set(addFabricAtom, fresh);
    expect(store.get(fabricsAtom).map((f) => f.id)).toEqual(['b', 'a']);
    expect(mockInsertFabric).toHaveBeenCalledWith(fresh);
  });

  test('fabricsByCategoryAtom groups by category, including empty key', () => {
    const store = createStore();
    store.set(fabricsAtom, [
      makeFabric('a', ''),
      makeFabric('b', 'cat'),
      makeFabric('c', 'cat'),
    ]);
    const groups = store.get(fabricsByCategoryAtom);
    expect(groups.get('')).toHaveLength(1);
    expect(groups.get('cat')).toHaveLength(2);
  });

  test('removeFabricAtom returns referenced=true and does not delete when force=false', async () => {
    mockIsFabricReferenced.mockResolvedValue(true);
    const store = createStore();
    store.set(fabricsAtom, [makeFabric('a', '')]);
    const result = await store.set(removeFabricAtom, { id: 'a' });
    expect(result).toEqual({ removed: false, referenced: true });
    expect(mockDeleteFabric).not.toHaveBeenCalled();
    expect(mockDeleteFabricImage).not.toHaveBeenCalled();
    expect(store.get(fabricsAtom)).toHaveLength(1);
  });

  test('removeFabricAtom force-deletes referenced fabric', async () => {
    mockIsFabricReferenced.mockResolvedValue(true);
    const fabric = makeFabric('a', '');
    const store = createStore();
    store.set(fabricsAtom, [fabric]);
    const result = await store.set(removeFabricAtom, { id: 'a', force: true });
    expect(result).toEqual({ removed: true, referenced: true });
    expect(mockDeleteFabric).toHaveBeenCalledWith('a');
    expect(mockDeleteFabricImage).toHaveBeenCalledWith(fabric.imagePath);
    expect(store.get(fabricsAtom)).toEqual([]);
  });

  test('removeFabricAtom deletes unreferenced fabric without force', async () => {
    mockIsFabricReferenced.mockResolvedValue(false);
    const fabric = makeFabric('a', '');
    const store = createStore();
    store.set(fabricsAtom, [fabric]);
    const result = await store.set(removeFabricAtom, { id: 'a' });
    expect(result).toEqual({ removed: true, referenced: false });
    expect(mockDeleteFabric).toHaveBeenCalledWith('a');
    expect(mockDeleteFabricImage).toHaveBeenCalledWith(fabric.imagePath);
  });

  test('removeFabricAtom no-ops for unknown id', async () => {
    const store = createStore();
    store.set(fabricsAtom, []);
    const result = await store.set(removeFabricAtom, { id: 'missing' });
    expect(result).toEqual({ removed: false, referenced: false });
    expect(mockIsFabricReferenced).not.toHaveBeenCalled();
  });
});
