import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAtom } from 'jotai';

import { type LanguagePreference, languagePreferenceAtom } from '@/atoms/settings';

interface Option {
  value: LanguagePreference;
  labelKey: 'settings.languageSystem' | 'settings.languageJa' | 'settings.languageEn';
}

const OPTIONS: Option[] = [
  { value: 'system', labelKey: 'settings.languageSystem' },
  { value: 'ja', labelKey: 'settings.languageJa' },
  { value: 'en', labelKey: 'settings.languageEn' },
];

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const [preference, setPreference] = useAtom(languagePreferenceAtom);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <View style={styles.group}>
        {OPTIONS.map((option, index) => {
          const selected = option.value === preference;
          const isLast = index === OPTIONS.length - 1;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(option.labelKey)}
              onPress={() => setPreference(option.value)}
              style={({ pressed }) => [
                styles.row,
                !isLast && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.label}>{t(option.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowPressed: {
    backgroundColor: '#f3f4f6',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  label: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
});
