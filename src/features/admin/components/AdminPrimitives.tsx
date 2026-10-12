/**
 * Small building blocks shared by the admin tabs: stat tile, status pill,
 * horizontal filter chips. Design-system tokens only.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';

export function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.lg,
          gap: theme.spacing.xs,
        },
      ]}
    >
      <Text variant="caption" color="secondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="title" color="primary">
        {value.toLocaleString()}
      </Text>
      {hint ? (
        <Text variant="caption" color="tertiary" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export type PillTone = 'accent' | 'success' | 'danger' | 'neutral' | 'strong';

export function StatusPill({ tone, label }: { tone: PillTone; label: string }): React.JSX.Element {
  const theme = useTheme();
  const color = {
    accent: theme.colors.accent,
    success: theme.colors.success,
    danger: theme.colors.danger,
    neutral: theme.colors.textTertiary,
    strong: theme.colors.textPrimary,
  }[tone];
  return (
    <View
      style={[
        styles.pill,
        { borderColor: color, borderRadius: theme.radii.full, paddingHorizontal: theme.spacing.sm },
      ]}
    >
      <Text variant="overline" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

interface ChipRowProps<T extends string> {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function ChipRow<T extends string>({ value, options, onChange, accessibilityLabel }: ChipRowProps<T>): React.JSX.Element {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              {
                borderRadius: theme.radii.full,
                borderColor: selected ? theme.colors.accent : theme.colors.border,
                backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
          >
            <Text variant="caption" color={selected ? 'inverse' : 'primary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, flexBasis: '45%', borderWidth: StyleSheet.hairlineWidth },
  pill: { borderWidth: 1, alignSelf: 'flex-start', paddingVertical: 2 },
  chip: { borderWidth: 1, paddingVertical: 6 },
});
