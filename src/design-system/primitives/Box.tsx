/**
 * Lumina — Box primitive
 *
 * A View wrapper with theme-aware spacing and surface shortcuts.
 * Keeps styling off screens; all values come from tokens.
 */

import React from 'react';
import {
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme';
import type { SpacingScale, RadiiScale } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SurfaceVariant = 'background' | 'surface' | 'surfaceElevated' | 'transparent';

export interface BoxProps extends ViewProps {
  /** Background surface token */
  bg?: SurfaceVariant;
  /** Uniform padding from spacing scale */
  p?: keyof SpacingScale;
  /** Horizontal padding */
  px?: keyof SpacingScale;
  /** Vertical padding */
  py?: keyof SpacingScale;
  /** Top padding */
  pt?: keyof SpacingScale;
  /** Bottom padding */
  pb?: keyof SpacingScale;
  /** Left padding */
  pl?: keyof SpacingScale;
  /** Right padding */
  pr?: keyof SpacingScale;
  /** Uniform margin */
  m?: keyof SpacingScale;
  /** Horizontal margin */
  mx?: keyof SpacingScale;
  /** Vertical margin */
  my?: keyof SpacingScale;
  /** Top margin */
  mt?: keyof SpacingScale;
  /** Bottom margin */
  mb?: keyof SpacingScale;
  /** Left margin */
  ml?: keyof SpacingScale;
  /** Right margin */
  mr?: keyof SpacingScale;
  /** Border radius token */
  radius?: keyof RadiiScale;
  /** Row flex direction */
  row?: boolean;
  /** flex: 1 */
  flex?: boolean;
  /** Center children (both axes) */
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Box({
  bg,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  radius,
  row,
  flex,
  center,
  style,
  ...rest
}: BoxProps): React.JSX.Element {
  const theme = useTheme();
  const sp = theme.spacing;
  const ra = theme.radii;

  const resolvedBg =
    bg === undefined || bg === 'transparent'
      ? undefined
      : bg === 'background'
      ? theme.colors.background
      : bg === 'surface'
      ? theme.colors.surface
      : theme.colors.surfaceElevated;

  const composed: ViewStyle = {
    // background
    ...(resolvedBg !== undefined ? { backgroundColor: resolvedBg } : {}),

    // padding
    ...(p !== undefined ? { padding: sp[p] } : {}),
    ...(px !== undefined ? { paddingHorizontal: sp[px] } : {}),
    ...(py !== undefined ? { paddingVertical: sp[py] } : {}),
    ...(pt !== undefined ? { paddingTop: sp[pt] } : {}),
    ...(pb !== undefined ? { paddingBottom: sp[pb] } : {}),
    ...(pl !== undefined ? { paddingLeft: sp[pl] } : {}),
    ...(pr !== undefined ? { paddingRight: sp[pr] } : {}),

    // margin
    ...(m !== undefined ? { margin: sp[m] } : {}),
    ...(mx !== undefined ? { marginHorizontal: sp[mx] } : {}),
    ...(my !== undefined ? { marginVertical: sp[my] } : {}),
    ...(mt !== undefined ? { marginTop: sp[mt] } : {}),
    ...(mb !== undefined ? { marginBottom: sp[mb] } : {}),
    ...(ml !== undefined ? { marginLeft: sp[ml] } : {}),
    ...(mr !== undefined ? { marginRight: sp[mr] } : {}),

    // radius
    ...(radius !== undefined ? { borderRadius: ra[radius] } : {}),

    // layout helpers
    ...(row === true ? { flexDirection: 'row' } : {}),
    ...(flex === true ? { flex: 1 } : {}),
    ...(center === true ? { alignItems: 'center', justifyContent: 'center' } : {}),
  };

  return <View style={[composed, style]} {...rest} />;
}
