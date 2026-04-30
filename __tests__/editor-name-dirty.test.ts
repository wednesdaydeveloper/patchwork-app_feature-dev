import { createStore } from 'jotai';

import {
  editingWorkNameAtom,
  editingWorkNameDirtyAtom,
  editingWorkSizeMmAtom,
  editingWorkSizeMmDirtyAtom,
  resetEditorAtom,
} from '@/atoms/editor';
import { WORK_SIZE_MM_DEFAULT } from '@/types/work';

describe('atoms/editor name dirty flag', () => {
  test('resetEditorAtom clears name and dirty flag', () => {
    const store = createStore();
    store.set(editingWorkNameAtom, 'Foo');
    store.set(editingWorkNameDirtyAtom, true);

    store.set(resetEditorAtom);

    expect(store.get(editingWorkNameAtom)).toBe('');
    expect(store.get(editingWorkNameDirtyAtom)).toBe(false);
  });

  test('dirty flag is independent of name value', () => {
    const store = createStore();
    store.set(editingWorkNameAtom, 'Foo');
    expect(store.get(editingWorkNameDirtyAtom)).toBe(false);

    store.set(editingWorkNameDirtyAtom, true);
    expect(store.get(editingWorkNameDirtyAtom)).toBe(true);
  });

  test('resetEditorAtom resets sizeMm to default and clears dirty', () => {
    const store = createStore();
    store.set(editingWorkSizeMmAtom, 200);
    store.set(editingWorkSizeMmDirtyAtom, true);

    store.set(resetEditorAtom);

    expect(store.get(editingWorkSizeMmAtom)).toBe(WORK_SIZE_MM_DEFAULT);
    expect(store.get(editingWorkSizeMmDirtyAtom)).toBe(false);
  });
});
