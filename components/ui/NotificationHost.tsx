import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  type DialogEntry,
  type ToastEntry,
  dialogQueueAtom,
  dismissDialogAtom,
  dismissToastAtom,
  toastQueueAtom,
} from '@/atoms/notification';
import { Dialog } from '@/components/ui/Dialog';
import { Toast } from '@/components/ui/Toast';

const DEFAULT_TOAST_MS = 3500;

/**
 * トースト・ダイアログを表示するルートホスト。
 * `app/_layout.tsx` で 1 度だけ配置し、全画面で `showToast` / `showDialog` から呼べるようにする。
 */
export const NotificationHost = () => {
  return (
    <>
      <DialogHost />
      <ToastHost />
    </>
  );
};

const ToastHost = () => {
  const toasts = useAtomValue(toastQueueAtom);
  return (
    <View pointerEvents="box-none" style={styles.toastContainer}>
      {toasts.map((entry) => (
        <ToastItem key={entry.id} entry={entry} />
      ))}
    </View>
  );
};

interface ToastItemProps {
  entry: ToastEntry;
}

const ToastItem = ({ entry }: ToastItemProps) => {
  const dismiss = useSetAtom(dismissToastAtom);

  useEffect(() => {
    const ms = entry.durationMs ?? DEFAULT_TOAST_MS;
    const timer = setTimeout(() => dismiss(entry.id), ms);
    return () => clearTimeout(timer);
  }, [entry.id, entry.durationMs, dismiss]);

  return (
    <Toast
      message={entry.message}
      variant={entry.variant}
      actionLabel={entry.actionLabel}
      onAction={() => {
        entry.onAction?.();
        dismiss(entry.id);
      }}
      onDismiss={() => dismiss(entry.id)}
    />
  );
};

const DialogHost = () => {
  const dialogs = useAtomValue(dialogQueueAtom);
  // FIFO で先頭の 1 件のみ表示する。閉じたら次のダイアログに進む。
  const current = dialogs[0];
  if (!current) {
    return null;
  }
  return <DialogItem entry={current} />;
};

interface DialogItemProps {
  entry: DialogEntry;
}

const DialogItem = ({ entry }: DialogItemProps) => {
  const dismiss = useSetAtom(dismissDialogAtom);
  const closeAndRun = (fn: () => void) => () => {
    fn();
    dismiss(entry.id);
  };
  return (
    <Dialog
      visible
      title={entry.title}
      message={entry.message}
      dismissOnBackdrop={entry.dismissOnBackdrop}
      onDismiss={() => dismiss(entry.id)}
      actions={entry.actions?.map((action) => ({
        ...action,
        onPress: closeAndRun(action.onPress),
      }))}
    />
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
