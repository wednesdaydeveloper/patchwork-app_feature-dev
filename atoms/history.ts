import { atom } from 'jotai';

import { pieceSettingsAtom } from '@/atoms/editor';
import type { PieceSetting } from '@/types/work';

const MAX_HISTORY = 20;

/**
 * 履歴の 1 スナップショット。`pieceSettings` のみを保存対象とする。
 *
 * CLAUDE.md「UI / UX」§ Undo/Redo の対象操作:
 * - 画像の対応づけ
 * - 位置調整
 * - 倍率調整
 * - 対応づけ解除
 *
 * いずれも `pieceSettings` の差分として表現できる。
 */
export interface HistorySnapshot {
  pieceSettings: PieceSetting[];
}

interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

const initialState: HistoryState = { past: [], future: [] };

const historyStateAtom = atom<HistoryState>(initialState);
historyStateAtom.debugLabel = 'historyState';

/**
 * 派生: undo 可能か。
 */
export const canUndoAtom = atom((get) => get(historyStateAtom).past.length > 0);
canUndoAtom.debugLabel = 'canUndo';

/**
 * 派生: redo 可能か。
 */
export const canRedoAtom = atom((get) => get(historyStateAtom).future.length > 0);
canRedoAtom.debugLabel = 'canRedo';

function snapshot(settings: PieceSetting[]): HistorySnapshot {
  // 浅いコピーで十分（PieceSetting は単純な値オブジェクト）
  return { pieceSettings: settings.map((s) => ({ ...s })) };
}

/**
 * 現在状態を履歴に push し、redo スタックをクリアする write-only atom。
 *
 * 直前の状態（`pieceSettingsAtom` の現在値）を `past` に積む。
 * これを呼んだ後、呼び出し側が `pieceSettingsAtom` を更新する想定。
 */
export const pushHistoryAtom = atom(null, (get, set) => {
  const current = get(pieceSettingsAtom);
  const state = get(historyStateAtom);
  const past = [...state.past, snapshot(current)];
  // 21 件以上は古い方から破棄
  if (past.length > MAX_HISTORY) {
    past.splice(0, past.length - MAX_HISTORY);
  }
  set(historyStateAtom, { past, future: [] });
});
pushHistoryAtom.debugLabel = 'pushHistory';

/**
 * 1 ステップ undo する write-only atom。
 * 現在状態を future に押し込み、past の末尾を pieceSettings に復元する。
 */
export const undoAtom = atom(null, (get, set) => {
  const state = get(historyStateAtom);
  if (state.past.length === 0) return;
  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);
  const current = get(pieceSettingsAtom);
  const newFuture = [...state.future, snapshot(current)];
  set(pieceSettingsAtom, previous.pieceSettings);
  set(historyStateAtom, { past: newPast, future: newFuture });
});
undoAtom.debugLabel = 'undo';

/**
 * 1 ステップ redo する write-only atom。
 */
export const redoAtom = atom(null, (get, set) => {
  const state = get(historyStateAtom);
  if (state.future.length === 0) return;
  const next = state.future[state.future.length - 1];
  const newFuture = state.future.slice(0, -1);
  const current = get(pieceSettingsAtom);
  const newPast = [...state.past, snapshot(current)];
  set(pieceSettingsAtom, next.pieceSettings);
  set(historyStateAtom, { past: newPast, future: newFuture });
});
redoAtom.debugLabel = 'redo';

/**
 * 履歴を全消去する write-only atom（パッチワーク切替・保存後再開時に呼ぶ）。
 */
export const clearHistoryAtom = atom(null, (_get, set) => {
  set(historyStateAtom, { past: [], future: [] });
});
clearHistoryAtom.debugLabel = 'clearHistory';
