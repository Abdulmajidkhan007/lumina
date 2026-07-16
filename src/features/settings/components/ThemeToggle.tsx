/**
 * Lumina — ThemeToggle
 *
 * Three-way toggle for light / dark / system colour scheme.
 * Reads and writes to usePreferencesStore.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePreferencesStore } from '@/stores/preferences.store';
import type { ColorSchemePreference } from '@/stores/preferences.store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThemeOption {
  value: ColorSchemePreference;
  icon: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
  labelKey: 'settings.rows.theme.light' | 'settings.rows.theme.dark' | 'settings.rows.theme.system';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPTIONS: ThemeOption[] = [
  { value: 'light', icon: 'sunny-outline', labelKey: 'settings.rows.theme.light' },
  { value: 'dark', icon: 'moon-outline', labelKey: 'settings.rows.theme.dark' },
  { value: 'system', icon: 'phone-portrait-outline', labelKey: 'settings.rows.theme.system' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ThemeToggle(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colorSchemePreference, setColorSchemePreference } = usePreferencesStore();

  const handleSelect = useCallback(
    (value: ColorSchemePreference) => {
      setColorSchemePreference(value);
    },
    [setColorSchemePreference],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.xxs,
          marginHorizontal: theme.spacing.lg,
          marginVertical: theme.spacing.sm,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const isActive = colorSchemePreference === opt.value;
        const label = t(opt.labelKey);
        return (
          <Pressable
            key={opt.value}
            onPress={() => handleSelect(opt.value)}
            style={[
              styles.option,
              {
                borderRadius: theme.radii.lg,
                backgroundColor: isActive
                  ? theme.colors.surfaceElevated
                  : 'transparent',
                paddingVertical: theme.spacing.sm,
                ...(isActive ? theme.shadows.sm : {}),
              },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={opt.icon}
              size={18}
              color={isActive ? theme.colors.accent : theme.colors.textTertiary}
            />
            <Text
              variant="caption"
              color={isActive ? 'accent' : 'tertiary'}
              align="center"
              style={{ marginTop: 2 }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
