import { atom } from 'jotai';

import type { ToastVariant } from '@/components/ui/Toast';

export interface ToastEntry {
  id: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface DialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

export interface DialogEntry {
  id: string;
  title?: string;
  message: string;
  actions?: DialogAction[];
  dismissOnBackdrop?: boolean;
}

/** 表示待ちトーストのキュー（FIFO）。 */
export const toastQueueAtom = atom<ToastEntry[]>([]);
toastQueueAtom.debugLabel = 'toastQueue';

/** 表示待ちダイアログのキュー（FIFO）。 */
export const dialogQueueAtom = atom<DialogEntry[]>([]);
dialogQueueAtom.debugLabel = 'dialogQueue';

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `n${Date.now()}-${nextId}`;
}

/** トーストを表示する write-only atom。 */
export const showToastAtom = atom(null, (get, set, entry: Omit<ToastEntry, 'id'>) => {
  const next: ToastEntry = { id: generateId(), ...entry };
  set(toastQueueAtom, [...get(toastQueueAtom), next]);
});
showToastAtom.debugLabel = 'showToast';

/** トーストを ID 指定で破棄する write-only atom。 */
export const dismissToastAtom = atom(null, (get, set, id: string) => {
  set(
    toastQueueAtom,
    get(toastQueueAtom).filter((t) => t.id !== id),
  );
});
dismissToastAtom.debugLabel = 'dismissToast';

/** ダイアログを表示する write-only atom。 */
export const showDialogAtom = atom(null, (get, set, entry: Omit<DialogEntry, 'id'>) => {
  const next: DialogEntry = { id: generateId(), ...entry };
  set(dialogQueueAtom, [...get(dialogQueueAtom), next]);
});
showDialogAtom.debugLabel = 'showDialog';

/** ダイアログを ID 指定で破棄する write-only atom。 */
export const dismissDialogAtom = atom(null, (get, set, id: string) => {
  set(
    dialogQueueAtom,
    get(dialogQueueAtom).filter((d) => d.id !== id),
  );
});
dismissDialogAtom.debugLabel = 'dismissDialog';
