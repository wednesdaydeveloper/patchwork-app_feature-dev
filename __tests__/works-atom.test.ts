import { createStore } from 'jotai';

import {
  loadWorksAtom,
  removeWorkAtom,
  saveWorkAtom,
  worksAtom,
  worksLoadedAtom,
} from '@/atoms/works';
import type { Work } from '@/types/work';

const mockSaveWork = jest.fn(async (_w: Work) => {});
const mockListWorks = jest.fn<Promise<Work[]>, []>();
const mockDeleteWork = jest.fn(async (_id: string) => {});

jest.mock('@/utils/db', () => ({
  saveWork: (w: Work) => mockSaveWork(w),
  listWorks: () => mockListWorks(),
  deleteWork: (id: string) => mockDeleteWork(id),
}));

function makeWork(id: string, updatedAt: number, name = id): Work {
  return {
    id,
    name,
    designId: 'd1',
    sizeMm: 150,
    createdAt: new Date(0),
    updatedAt: new Date(updatedAt),
    pieceSettings: [],
  };
}

beforeEach(() => {
  mockSaveWork.mockClear();
  mockListWorks.mockReset();
  mockDeleteWork.mockClear();
});

describe('atoms/works', () => {
  test('loadWorksAtom populates worksAtom and sets loaded flag', async () => {
    const works = [makeWork('a', 100), makeWork('b', 200)];
    mockListWorks.mockResolvedValue(works);
    const store = createStore();
    await store.set(loadWorksAtom);
    expect(store.get(worksAtom)).toEqual(works);
    expect(store.get(worksLoadedAtom)).toBe(true);
  });

  test('loadWorksAtom sets loaded flag even when listWorks throws', async () => {
    mockListWorks.mockRejectedValue(new Error('db'));
    const store = createStore();
    await expect(store.set(loadWorksAtom)).rejects.toThrow('db');
    expect(store.get(worksLoadedAtom)).toBe(true);
  });

  test('saveWorkAtom upserts and re-sorts by updatedAt desc', async () => {
    const store = createStore();
    store.set(worksAtom, [makeWork('a', 100), makeWork('b', 200)]);
    const updated = makeWork('a', 300, 'a-new');
    await store.set(saveWorkAtom, updated);
    const list = store.get(worksAtom);
    expect(list.map((w) => w.id)).toEqual(['a', 'b']);
    expect(list[0].name).toBe('a-new');
    expect(mockSaveWork).toHaveBeenCalledWith(updated);
  });

  test('saveWorkAtom adds a new work', async () => {
    const store = createStore();
    store.set(worksAtom, [makeWork('a', 100)]);
    const fresh = makeWork('c', 500);
    await store.set(saveWorkAtom, fresh);
    const list = store.get(worksAtom);
    expect(list.map((w) => w.id)).toEqual(['c', 'a']);
  });

  test('removeWorkAtom removes from worksAtom and calls deleteWork', async () => {
    const store = createStore();
    store.set(worksAtom, [makeWork('a', 100), makeWork('b', 200)]);
    await store.set(removeWorkAtom, 'a');
    expect(store.get(worksAtom).map((w) => w.id)).toEqual(['b']);
    expect(mockDeleteWork).toHaveBeenCalledWith('a');
  });
});
