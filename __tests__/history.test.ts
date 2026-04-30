import { createStore } from 'jotai';

import { pieceSettingsAtom } from '@/atoms/editor';
import {
  canRedoAtom,
  canUndoAtom,
  clearHistoryAtom,
  pushHistoryAtom,
  redoAtom,
  undoAtom,
} from '@/atoms/history';
import type { PieceSetting } from '@/types/work';

function makeSetting(polygonId: string, rotation: number): PieceSetting {
  return {
    polygonId,
    fabricImageId: 'f1',
    offsetX: 0,
    offsetY: 0,
    rotation,
  };
}

describe('atoms/history', () => {
  test('push -> undo restores previous state and enables redo', () => {
    const store = createStore();
    const initial = [makeSetting('a', 1)];
    store.set(pieceSettingsAtom, initial);

    // 状態 1 を push してから状態 2 へ更新
    store.set(pushHistoryAtom);
    store.set(pieceSettingsAtom, [makeSetting('a', 2)]);

    expect(store.get(canUndoAtom)).toBe(true);
    expect(store.get(canRedoAtom)).toBe(false);

    store.set(undoAtom);
    expect(store.get(pieceSettingsAtom)[0].rotation).toBe(1);
    expect(store.get(canUndoAtom)).toBe(false);
    expect(store.get(canRedoAtom)).toBe(true);

    store.set(redoAtom);
    expect(store.get(pieceSettingsAtom)[0].rotation).toBe(2);
  });

  test('history is capped at 20 entries', () => {
    const store = createStore();
    store.set(pieceSettingsAtom, [makeSetting('a', 0)]);
    for (let i = 1; i <= 25; i += 1) {
      store.set(pushHistoryAtom);
      store.set(pieceSettingsAtom, [makeSetting('a', i)]);
    }
    // 20 回までしか戻せない
    let undoCount = 0;
    while (store.get(canUndoAtom)) {
      store.set(undoAtom);
      undoCount += 1;
      if (undoCount > 30) throw new Error('infinite loop');
    }
    expect(undoCount).toBe(20);
  });

  test('clearHistoryAtom resets past and future', () => {
    const store = createStore();
    store.set(pieceSettingsAtom, [makeSetting('a', 1)]);
    store.set(pushHistoryAtom);
    store.set(pieceSettingsAtom, [makeSetting('a', 2)]);
    expect(store.get(canUndoAtom)).toBe(true);
    store.set(clearHistoryAtom);
    expect(store.get(canUndoAtom)).toBe(false);
    expect(store.get(canRedoAtom)).toBe(false);
  });

  test('a new push after undo clears the redo stack', () => {
    const store = createStore();
    store.set(pieceSettingsAtom, [makeSetting('a', 1)]);
    store.set(pushHistoryAtom);
    store.set(pieceSettingsAtom, [makeSetting('a', 2)]);
    store.set(undoAtom);
    expect(store.get(canRedoAtom)).toBe(true);

    store.set(pushHistoryAtom);
    store.set(pieceSettingsAtom, [makeSetting('a', 3)]);
    expect(store.get(canRedoAtom)).toBe(false);
  });
});
