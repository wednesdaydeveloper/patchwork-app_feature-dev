import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';

export interface PromptField {
  key: string;
  placeholder: string;
  initialValue?: string;
  /** 必須入力か（空欄時は確定不可）。デフォルト false */
  required?: boolean;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
}

export interface PromptDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  fields: PromptField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

/**
 * 入力フィールド付きダイアログ。布地登録の名前 + カテゴリ入力など、
 * `Dialog` の単純メッセージでは足りないケースで使う。
 */
export const PromptDialog = ({
  visible,
  title,
  message,
  fields,
  submitLabel,
  onSubmit,
  onCancel,
}: PromptDialogProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const initial: Record<string, string> = {};
      for (const field of fields) {
        initial[field.key] = field.initialValue ?? '';
      }
      setValues(initial);
    }
  }, [visible, fields]);

  const canSubmit = fields.every((f) => !f.required || (values[f.key]?.trim().length ?? 0) > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable accessibilityRole="none" style={styles.backdrop} onPress={onCancel}>
          <Pressable accessibilityRole="none" onPress={(e) => e.stopPropagation()} style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            {fields.map((field) => (
              <TextInput
                key={field.key}
                accessibilityLabel={field.placeholder}
                placeholder={field.placeholder}
                placeholderTextColor="#9ca3af"
                value={values[field.key] ?? ''}
                onChangeText={(text) =>
                  setValues((prev) => ({ ...prev, [field.key]: text }))
                }
                autoFocus={field.autoFocus}
                keyboardType={field.keyboardType}
                style={styles.input}
              />
            ))}
            <View style={styles.actions}>
              <Button
                label={submitLabel ?? t('common.save')}
                variant="primary"
                disabled={!canSubmit}
                onPress={() => onSubmit(values)}
                style={styles.actionButton}
              />
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={onCancel}
                style={styles.actionButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
