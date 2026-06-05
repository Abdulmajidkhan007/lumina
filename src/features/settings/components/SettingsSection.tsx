/**
 * Lumina — SettingsSection
 *
 * Groups settings rows under a header label with a surface card style.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsSection({
  title,
  children,
}: SettingsSectionProps): React.JSX.Element {
  const theme = useTheme();

  const childArray = React.Children.toArray(children);

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {title !== undefined && title !== '' ? (
        <Text
          variant="overline"
          color="tertiary"
          style={{
            marginBottom: theme.spacing.sm,
            marginHorizontal: theme.spacing.lg,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.xl,
            overflow: 'hidden',
            ...theme.shadows.sm,
          },
        ]}
      >
        {childArray.map((child, i) => (
          <React.Fragment key={i}>
            {child}
            {i < childArray.length - 1 ? (
              <Divider mx={theme.spacing.lg} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    // surface + borderRadius applied inline
  },
});
