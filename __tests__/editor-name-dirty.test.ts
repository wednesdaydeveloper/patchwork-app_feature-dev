import { createStore } from 'jotai';

import {
  editingWorkNameAtom,
  editingWorkNameDirtyAtom,
  resetEditorAtom,
} from '@/atoms/editor';

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
});
