import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import {
  WORK_SIZE_MM_DEFAULT,
  WORK_SIZE_MM_MAX,
  WORK_SIZE_MM_MIN,
} from '@/types/work';

export const SizeSelectScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { designId } = useLocalSearchParams<{ designId: string }>();
  const [text, setText] = useState(String(WORK_SIZE_MM_DEFAULT));
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    const value = Number(text);
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      setError(t('newWorkSize.invalidNumber'));
      return;
    }
    if (value < WORK_SIZE_MM_MIN || value > WORK_SIZE_MM_MAX) {
      setError(
        t('newWorkSize.invalidRange', {
          min: WORK_SIZE_MM_MIN,
          max: WORK_SIZE_MM_MAX,
        }),
      );
      return;
    }
    router.replace({
      pathname: '/editor/[id]',
      params: { id: 'new', designId, sizeMm: String(value) },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
      <Text style={styles.title}>{t('newWorkSize.title')}</Text>
      <Text style={styles.description}>
        {t('newWorkSize.description', {
          min: WORK_SIZE_MM_MIN,
          max: WORK_SIZE_MM_MAX,
        })}
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('newWorkSize.label')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel={t('newWorkSize.label')}
            keyboardType="number-pad"
            value={text}
            onChangeText={(next) => {
              setText(next);
              setError(null);
            }}
            style={styles.input}
            maxLength={3}
          />
          <Text style={styles.unit}>mm</Text>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.hint}>
          {t('newWorkSize.hint', { default: WORK_SIZE_MM_DEFAULT })}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
        <Button label={t('newWorkSize.start')} onPress={handleStart} />
      </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 600,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  field: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
  },
  error: {
    fontSize: 12,
    color: '#dc2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
