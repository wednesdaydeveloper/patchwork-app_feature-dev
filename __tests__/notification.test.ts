import { createStore } from 'jotai';

import {
  dialogQueueAtom,
  dismissDialogAtom,
  dismissToastAtom,
  showDialogAtom,
  showToastAtom,
  toastQueueAtom,
} from '@/atoms/notification';

describe('atoms/notification', () => {
  test('showToastAtom enqueues a toast with generated id', () => {
    const store = createStore();
    store.set(showToastAtom, { message: 'hello' });
    const queue = store.get(toastQueueAtom);
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('hello');
    expect(typeof queue[0].id).toBe('string');
    expect(queue[0].id.length).toBeGreaterThan(0);
  });

  test('showToastAtom appends in FIFO order with unique ids', () => {
    const store = createStore();
    store.set(showToastAtom, { message: 'a' });
    store.set(showToastAtom, { message: 'b' });
    const queue = store.get(toastQueueAtom);
    expect(queue.map((t) => t.message)).toEqual(['a', 'b']);
    expect(queue[0].id).not.toBe(queue[1].id);
  });

  test('dismissToastAtom removes only the matching toast', () => {
    const store = createStore();
    store.set(showToastAtom, { message: 'a' });
    store.set(showToastAtom, { message: 'b' });
    const target = store.get(toastQueueAtom)[0];
    store.set(dismissToastAtom, target.id);
    const queue = store.get(toastQueueAtom);
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('b');
  });

  test('dismissToastAtom is no-op for unknown id', () => {
    const store = createStore();
    store.set(showToastAtom, { message: 'a' });
    store.set(dismissToastAtom, 'unknown');
    expect(store.get(toastQueueAtom)).toHaveLength(1);
  });

  test('showDialogAtom enqueues a dialog with generated id', () => {
    const store = createStore();
    store.set(showDialogAtom, { message: 'confirm?' });
    const queue = store.get(dialogQueueAtom);
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('confirm?');
    expect(typeof queue[0].id).toBe('string');
  });

  test('dismissDialogAtom removes only the matching dialog', () => {
    const store = createStore();
    store.set(showDialogAtom, { message: 'a' });
    store.set(showDialogAtom, { message: 'b' });
    const ids = store.get(dialogQueueAtom).map((d) => d.id);
    store.set(dismissDialogAtom, ids[1]);
    const remaining = store.get(dialogQueueAtom);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('a');
  });
});
