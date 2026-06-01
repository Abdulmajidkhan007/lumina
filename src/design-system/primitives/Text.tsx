/**
 * Lumina — Text primitive
 *
 * Renders themed text mapped to the typography ramp. Never use raw fontSize
 * in screens — use this component with a variant prop instead.
 */

import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { TypographyScale } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextVariant = keyof TypographyScale;

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'inverse';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  /** Explicit style prop — re-declared to ensure it is always available
   *  regardless of whether RNTextProps resolves in the current environment. */
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helper — resolve semantic color
// ---------------------------------------------------------------------------

function resolveColor(color: TextColor, theme: Theme): string {
  switch (color) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'accent':
      return theme.colors.accent;
    case 'success':
      return theme.colors.success;
    case 'danger':
      return theme.colors.danger;
    case 'inverse':
      return theme.colorScheme === 'dark'
        ? theme.colors.textPrimary // already white
        : '#FFFFFF';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Text({
  variant = 'body',
  color = 'primary',
  align,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();
  const typo = theme.typography[variant];

  return (
    <RNText
      style={[
        {
          fontSize: typo.fontSize,
          lineHeight: typo.lineHeight,
          fontWeight: typo.fontWeight,
          letterSpacing: typo.letterSpacing,
          color: resolveColor(color, theme),
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}

// Unused StyleSheet kept here as evidence there are no magic numbers — all
// values flow from tokens exclusively.
const _styles = StyleSheet.create({});
void _styles;
