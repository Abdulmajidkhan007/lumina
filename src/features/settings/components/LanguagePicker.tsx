/**
 * Lumina — LanguagePicker
 *
 * Centered themed modal for choosing the app language — replaces the old
 * bottom Sheet. Each row shows a flag, the language name, and a checkmark
 * on the active option. Shares the same Reanimated scale/fade entrance as
 * ConfirmDialog for a consistent modal feel across the app.
 */

import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import type { AppLocale } from '@/stores/preferences.store';

// ---------------------------------------------------------------------------
// Options — order shown in the picker: English, Русский, O'zbekcha, System.
// `as const satisfies` keeps `labelKey` narrowed to the literal translation
// key union so `t()` stays type-checked.
// ---------------------------------------------------------------------------

export interface LanguageOption {
  locale: AppLocale;
  flag: string;
  labelKey:
    | 'settings.rows.language.english'
    | 'settings.rows.language.russian'
    | 'settings.rows.language.uzbek'
    | 'settings.rows.language.system';
}

export const LANGUAGE_OPTIONS = [
  { locale: 'en', flag: '🇬🇧', labelKey: 'settings.rows.language.english' },
  { locale: 'ru', flag: '🇷🇺', labelKey: 'settings.rows.language.russian' },
  { locale: 'uz', flag: '🇺🇿', labelKey: 'settings.rows.language.uzbek' },
  { locale: 'system', flag: '⚙️', labelKey: 'settings.rows.language.system' },
] as const satisfies readonly LanguageOption[];

/** Resolves the flag emoji for the currently active locale preference. */
export function getLanguageFlag(locale: AppLocale): string {
  return LANGUAGE_OPTIONS.find((option) => option.locale === locale)?.flag ?? LANGUAGE_OPTIONS[3].flag;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LanguagePickerProps {
  visible: boolean;
  locale: AppLocale;
  onSelect: (locale: AppLocale) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.9,
} as const;

const ENTER_DURATION = 200;
const EXIT_DURATION = 150;
const HIDDEN_SCALE = 0.9;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LanguagePicker({
  visible,
  locale,
  onSelect,
  onClose,
}: LanguagePickerProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();

  const scale = useSharedValue(HIDDEN_SCALE);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: ENTER_DURATION });
    } else {
      scale.value = withTiming(HIDDEN_SCALE, { duration: EXIT_DURATION });
      opacity.value = withTiming(0, { duration: EXIT_DURATION });
    }
  }, [visible, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme.colors.overlay },
          backdropStyle,
        ]}
        pointerEvents="none"
      />

      {/* Tap-outside to dismiss */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      />

      {/* Card */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: theme.radii['2xl'],
              paddingVertical: theme.spacing.lg,
              ...theme.shadows.lg,
            },
            cardStyle,
          ]}
        >
          <Text
            variant="bodyStrong"
            color="primary"
            align="center"
            style={{
              paddingHorizontal: theme.spacing.lg,
              marginBottom: theme.spacing.md,
            }}
          >
            {t('settings.rows.language.label')}
          </Text>
          <Divider mx={theme.spacing.lg} />

          {LANGUAGE_OPTIONS.map((option, index) => {
            const isActive = locale === option.locale;
            return (
              <React.Fragment key={option.locale}>
                <Pressable
                  onPress={() => onSelect(option.locale)}
                  style={[
                    styles.row,
                    {
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t(option.labelKey)}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    variant="bodyStrong"
                    style={{ marginRight: theme.spacing.md }}
                  >
                    {option.flag}
                  </Text>
                  <Text variant="callout" color="primary" style={styles.label}>
                    {t(option.labelKey)}
                  </Text>
                  {isActive ? (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.accent}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  ) : null}
                </Pressable>
                {index < LANGUAGE_OPTIONS.length - 1 ? (
                  <Divider mx={theme.spacing.lg} />
                ) : null}
              </React.Fragment>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
});
