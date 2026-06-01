/**
 * Lumina — Spinner primitive
 *
 * Lightweight activity indicator mapped to theme colors.
 */

import React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

import { useTheme } from '../theme';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  size?: SpinnerSize;
  /** Defaults to theme accent color */
  colorVariant?: 'accent' | 'primary' | 'secondary' | 'inverse';
}

const sizeMap: Record<SpinnerSize, number | 'small' | 'large'> = {
  sm: 'small',
  md: 'large',
  lg: 'large',
};

export function Spinner({
  size = 'md',
  colorVariant = 'accent',
  ...rest
}: SpinnerProps): React.JSX.Element {
  const theme = useTheme();

  const color =
    colorVariant === 'accent'
      ? theme.colors.accent
      : colorVariant === 'primary'
      ? theme.colors.textPrimary
      : colorVariant === 'secondary'
      ? theme.colors.textSecondary
      : '#FFFFFF';

  return (
    <ActivityIndicator
      size={sizeMap[size]}
      color={color}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      {...rest}
    />
  );
}
