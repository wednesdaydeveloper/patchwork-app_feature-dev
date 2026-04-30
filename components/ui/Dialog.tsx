import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';

export interface DialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

export interface DialogProps {
  visible: boolean;
  title?: string;
  message: string;
  actions?: DialogAction[];
  /** 背景タップで閉じるか（デフォルト false） */
  dismissOnBackdrop?: boolean;
  onDismiss?: () => void;
}

export const Dialog = ({
  visible,
  title,
  message,
  actions,
  dismissOnBackdrop = false,
  onDismiss,
}: DialogProps) => {
  const { t } = useTranslation();
  const resolvedActions: DialogAction[] =
    actions && actions.length > 0
      ? actions
      : [{ label: t('common.ok'), variant: 'primary', onPress: onDismiss ?? (() => undefined) }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <Pressable
        accessibilityRole="none"
        style={styles.backdrop}
        onPress={dismissOnBackdrop ? onDismiss : undefined}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(e) => e.stopPropagation()}
          style={styles.card}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {resolvedActions.map((action) => (
              <Button
                key={action.label}
                label={action.label}
                variant={action.variant ?? 'primary'}
                onPress={action.onPress}
                style={styles.actionButton}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: '100%',
  },
});
