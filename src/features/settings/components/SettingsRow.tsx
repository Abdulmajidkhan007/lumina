/**
 * Lumina — SettingsRow
 *
 * A single settings list row with icon, label, and a right slot
 * (chevron, Switch, or custom element). Pressable with ripple.
 */

import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SettingsRowRight =
  | { type: 'chevron' }
  | { type: 'switch'; value: boolean; onValueChange: (v: boolean) => void }
  | { type: 'none' };

export interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Optional subtitle */
  sublabel?: string;
  right?: SettingsRowRight;
  onPress?: () => void;
  /** Danger style for destructive actions */
  danger?: boolean;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SettingsRow = React.memo(function SettingsRow({
  icon,
  label,
  sublabel,
  right = { type: 'chevron' },
  onPress,
  danger = false,
  accessibilityLabel,
}: SettingsRowProps): React.JSX.Element {
  const theme = useTheme();

  const iconColor = danger ? theme.colors.danger : theme.colors.textSecondary;
  const labelColor = danger ? ('danger' as const) : ('primary' as const);

  const isSwitch = right.type === 'switch';

  return (
    <Pressable
      onPress={isSwitch ? undefined : onPress}
      disabled={isSwitch || onPress === undefined}
      hitSlop={hitSlop.sm}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: pressed
            ? theme.colors.surface
            : 'transparent',
        },
      ]}
      accessibilityRole={isSwitch ? 'none' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        isSwitch ? { checked: (right as Extract<SettingsRowRight, { type: 'switch' }>).value } : undefined
      }
    >
      {/* Left icon */}
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      {/* Label block */}
      <View style={[styles.labelBlock, { marginLeft: theme.spacing.md }]}>
        <Text variant="callout" color={labelColor}>
          {label}
        </Text>
        {sublabel !== undefined && sublabel !== '' ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {/* Right slot */}
      {right.type === 'chevron' ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : right.type === 'switch' ? (
        <Switch
          value={right.value}
          onValueChange={right.onValueChange}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.accent,
          }}
          thumbColor={theme.colors.surface}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityRole="switch"
          accessibilityState={{ checked: right.value }}
        />
      ) : null}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBlock: {
    flex: 1,
    justifyContent: 'center',
  },
});
