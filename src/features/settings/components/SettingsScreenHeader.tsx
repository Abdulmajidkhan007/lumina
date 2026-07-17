/**
 * Lumina — SettingsScreenHeader
 *
 * Shared back-button + centered-title header used by every settings
 * sub-screen (Change Password, Notifications, Privacy, Help Centre, etc).
 * Mirrors the inline header pattern used by SettingsScreen itself.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsScreenHeaderProps {
  title: string;
  onBack: () => void;
  backAccessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsScreenHeader({
  title,
  onBack,
  backAccessibilityLabel,
}: SettingsScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={hitSlop.md}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel ?? title}
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>

      <Text variant="bodyStrong" color="primary">
        {title}
      </Text>

      {/* Spacer keeps the title centred between back button and right edge */}
      <View style={styles.headerSpacer} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
});
