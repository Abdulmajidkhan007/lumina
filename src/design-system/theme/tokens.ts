/**
 * Lumina Design System — Design Tokens
 *
 * Single source of truth for all visual constants.
 * No raw hex values or magic numbers should appear outside this file.
 */

import { Platform, type TextStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Primitive color palette (not exported for direct use — use semantic tokens)
// ---------------------------------------------------------------------------

const Palette = {
  // Warm whites & near-whites
  white: '#FFFFFF',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey150: '#EFEFEF',
  grey200: '#E8E8E8',
  grey300: '#D4D4D4',
  grey400: '#B0B0B0',
  grey500: '#8A8A8A',
  grey600: '#6B6B6B',
  grey700: '#4A4A4A',
  grey800: '#2E2E2E',
  grey850: '#1E1E1E',
  grey900: '#141414',
  grey950: '#0A0A0A',
  black: '#000000',

  // Luminous accent spectrum (warm → violet)
  coral: '#FF6B6B',
  magenta: '#C44FE8',
  violet: '#6B5BFF',

  // Semantic utility colours
  emerald: '#34C759',
  crimson: '#FF3B30',

  // Overlays
  blackA30: 'rgba(0,0,0,0.30)',
  blackA50: 'rgba(0,0,0,0.50)',
  blackA70: 'rgba(0,0,0,0.70)',
  whiteA10: 'rgba(255,255,255,0.10)',
  whiteA20: 'rgba(255,255,255,0.20)',
} as const;

// ---------------------------------------------------------------------------
// Semantic color sets
// ---------------------------------------------------------------------------

export interface SemanticColors {
  /** App-level background — the canvas */
  background: string;
  /** Card / panel surface sitting on top of background */
  surface: string;
  /** Elevated surface (modals, popovers, action sheets) */
  surfaceElevated: string;
  /** Subtle dividers and input borders */
  border: string;
  /** Primary readable text */
  textPrimary: string;
  /** Supporting/secondary text */
  textSecondary: string;
  /** Placeholder / disabled text */
  textTertiary: string;
  /** Solid accent for icon tints, small badges */
  accent: string;
  /** Ordered stops for the signature luminous gradient */
  accentGradient: readonly [string, string, string];
  /** Positive / success */
  success: string;
  /** Destructive / error */
  danger: string;
  /** Scrim overlay (e.g. behind modals) */
  overlay: string;
  /** Base colour for skeleton loaders */
  skeletonBase: string;
  /** Highlight sweep colour for skeleton shimmer */
  skeletonHighlight: string;
}

export const lightColors: SemanticColors = {
  background: Palette.grey50,
  surface: Palette.white,
  surfaceElevated: Palette.white,
  border: Palette.grey200,
  textPrimary: Palette.grey950,
  textSecondary: Palette.grey600,
  textTertiary: Palette.grey400,
  accent: Palette.violet,
  accentGradient: [Palette.coral, Palette.magenta, Palette.violet],
  success: Palette.emerald,
  danger: Palette.crimson,
  overlay: Palette.blackA50,
  skeletonBase: Palette.grey150,
  skeletonHighlight: Palette.grey50,
} as const;

export const darkColors: SemanticColors = {
  background: Palette.grey950,
  surface: Palette.grey900,
  surfaceElevated: Palette.grey850,
  border: Palette.grey800,
  textPrimary: Palette.white,
  textSecondary: Palette.grey400,
  textTertiary: Palette.grey600,
  accent: Palette.coral,
  accentGradient: [Palette.coral, Palette.magenta, Palette.violet],
  success: Palette.emerald,
  danger: Palette.crimson,
  overlay: Palette.blackA70,
  skeletonBase: Palette.grey800,
  skeletonHighlight: Palette.grey700,
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (4-point grid)
// ---------------------------------------------------------------------------

export interface SpacingScale {
  /** 2 */
  xxs: number;
  /** 4 */
  xs: number;
  /** 8 */
  sm: number;
  /** 12 */
  md: number;
  /** 16 */
  lg: number;
  /** 20 */
  xl: number;
  /** 24 */
  '2xl': number;
  /** 32 */
  '3xl': number;
  /** 40 */
  '4xl': number;
  /** 48 */
  '5xl': number;
  /** 64 */
  '6xl': number;
}

export const spacing: SpacingScale = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// ---------------------------------------------------------------------------
// Border radius scale
// ---------------------------------------------------------------------------

export interface RadiiScale {
  /** 4 */
  sm: number;
  /** 8 */
  md: number;
  /** 12 */
  lg: number;
  /** 16 */
  xl: number;
  /** 24 */
  '2xl': number;
  /** 9999 — circular/pill */
  full: number;
}

export const radii: RadiiScale = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography ramp
// ---------------------------------------------------------------------------

export interface TypographyVariant {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing?: number;
}

export interface TypographyScale {
  /** 34 / bold — hero headlines */
  display: TypographyVariant;
  /** 28 / semibold — screen titles */
  title: TypographyVariant;
  /** 22 / semibold — section headers */
  headline: TypographyVariant;
  /** 17 / semibold — card / list titles */
  bodyStrong: TypographyVariant;
  /** 17 / regular — standard reading copy */
  body: TypographyVariant;
  /** 15 / regular — secondary copy */
  callout: TypographyVariant;
  /** 13 / regular — timestamps, labels */
  caption: TypographyVariant;
  /** 11 / medium — tab labels, badges */
  overline: TypographyVariant;
}

export const typography: TypographyScale = {
  display: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: 0.36,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  bodyStrong: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.06,
  },
} as const;

// ---------------------------------------------------------------------------
// Shadows / elevation presets
// ---------------------------------------------------------------------------

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

export interface ShadowScale {
  sm: ShadowPreset;
  md: ShadowPreset;
  lg: ShadowPreset;
}

const buildShadow = (
  height: number,
  opacity: number,
  radius: number,
  elevation: number,
): ShadowPreset => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows: ShadowScale = {
  sm: buildShadow(1, 0.06, 4, 2),
  md: buildShadow(4, 0.1, 12, 6),
  lg: buildShadow(12, 0.16, 24, 16),
} as const;

// ---------------------------------------------------------------------------
// Aggregated Tokens type
// ---------------------------------------------------------------------------

export interface Tokens {
  spacing: SpacingScale;
  radii: RadiiScale;
  typography: TypographyScale;
  shadows: ShadowScale;
}

export const tokens: Tokens = {
  spacing,
  radii,
  typography,
  shadows,
} as const;

// Re-export platform helper used by shadow-aware components
export const isIOS = Platform.OS === 'ios';
