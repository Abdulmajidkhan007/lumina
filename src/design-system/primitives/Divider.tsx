/**
 * Lumina — Divider primitive
 *
 * Thin horizontal or vertical separator using the theme border color.
 */

import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DividerProps {
  /** Defaults to horizontal */
  orientation?: 'horizontal' | 'vertical';
  /** Multiplier for the default 1px thickness */
  thickness?: 1 | 2;
  /** Horizontal margin shorthand (horizontal only) */
  mx?: number;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Divider({
  orientation = 'horizontal',
  thickness = 1,
  mx,
  style,
}: DividerProps): React.JSX.Element {
  const theme = useTheme();

  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.border,
          ...(isHorizontal
            ? {
                height: thickness,
                alignSelf: 'stretch',
                marginHorizontal: mx,
              }
            : {
                width: thickness,
                alignSelf: 'stretch',
              }),
        },
        style,
      ]}
      accessibilityRole="none"
      importantForAccessibility="no"
    />
  );
}
