/**
 * Single-series daily column chart built from Views (no chart dependency).
 * Thin columns with 2px gaps, rounded tops on a baseline, a max gridline,
 * and tap-to-inspect: the caption shows the selected day's value.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { niceCeil } from '@/utils/admin';

export interface ChartPoint {
  label: string;
  value: number;
}

const PLOT_HEIGHT = 120;
const COLUMN_GAP = 2;

export function MiniBarChart({ title, points }: { title: string; points: readonly ChartPoint[] }): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [selected, setSelected] = useState<number | null>(null);
  const max = niceCeil(Math.max(0, ...points.map((p) => p.value)));
  const active = selected === null ? null : points[selected];
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.header}>
        <Text variant="callout" color="primary" style={styles.flex}>
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {active ? t('overview.chartValue', { day: active.label, value: active.value }) : String(max)}
        </Text>
      </View>
      <View style={[styles.plot, { borderBottomColor: theme.colors.textTertiary, borderTopColor: theme.colors.border }]}>
        {points.map((p, i) => {
          const isActive = selected === i;
          return (
            <Pressable
              key={p.label}
              accessibilityRole="button"
              accessibilityLabel={t('overview.chartValue', { day: p.label, value: p.value })}
              onPress={() => setSelected(isActive ? null : i)}
              style={styles.column}
            >
              <View
                style={{
                  height: p.value > 0 ? Math.max(2, (p.value / max) * PLOT_HEIGHT) : 0,
                  backgroundColor: theme.colors.accent,
                  opacity: selected === null || isActive ? 1 : 0.4,
                  borderTopLeftRadius: theme.radii.sm,
                  borderTopRightRadius: theme.radii.sm,
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.header}>
        <Text variant="caption" color="tertiary">
          {first?.label ?? ''}
        </Text>
        <Text variant="caption" color="tertiary">
          {last?.label ?? ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, flexGrow: 1, flexBasis: 280 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex: { flex: 1 },
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: COLUMN_GAP,
    borderBottomWidth: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  column: { flex: 1, height: '100%', justifyContent: 'flex-end' },
});
