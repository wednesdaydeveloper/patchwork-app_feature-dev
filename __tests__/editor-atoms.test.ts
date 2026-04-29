import { createStore } from 'jotai';

import {
  pieceSettingsAtom,
  removePieceSettingAtom,
  selectedPieceSettingAtom,
  selectedPolygonIdAtom,
  upsertPieceSettingAtom,
} from '@/atoms/editor';
import type { PieceSetting } from '@/types/work';

const sample: PieceSetting = {
  polygonId: 'p1',
  fabricImageId: 'f1',
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

describe('atoms/editor', () => {
  test('upsertPieceSettingAtom inserts and then updates by polygonId', () => {
    const store = createStore();
    store.set(upsertPieceSettingAtom, sample);
    expect(store.get(pieceSettingsAtom)).toHaveLength(1);

    store.set(upsertPieceSettingAtom, { ...sample, scale: 2 });
    const list = store.get(pieceSettingsAtom);
    expect(list).toHaveLength(1);
    expect(list[0].scale).toBe(2);
  });

  test('removePieceSettingAtom removes the matching polygon', () => {
    const store = createStore();
    store.set(upsertPieceSettingAtom, sample);
    store.set(upsertPieceSettingAtom, { ...sample, polygonId: 'p2' });
    store.set(removePieceSettingAtom, 'p1');
    const list = store.get(pieceSettingsAtom);
    expect(list).toHaveLength(1);
    expect(list[0].polygonId).toBe('p2');
  });

  test('selectedPieceSettingAtom returns the setting for the selected polygon', () => {
    const store = createStore();
    store.set(upsertPieceSettingAtom, sample);
    store.set(upsertPieceSettingAtom, { ...sample, polygonId: 'p2', scale: 3 });

    store.set(selectedPolygonIdAtom, 'p2');
    expect(store.get(selectedPieceSettingAtom)?.scale).toBe(3);

    store.set(selectedPolygonIdAtom, null);
    expect(store.get(selectedPieceSettingAtom)).toBeNull();
  });
});
