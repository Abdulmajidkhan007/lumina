/**
 * Lumina Design System — top-level barrel
 *
 * Single entry-point for the entire design system. Import everything from
 * '@/design-system' in screens and features.
 */

// ---- Theme ----------------------------------------------------------------
export {
  lightColors,
  darkColors,
  spacing,
  radii,
  typography,
  shadows,
  tokens,
  isIOS,
} from './theme';

export type {
  SemanticColors,
  SpacingScale,
  RadiiScale,
  TypographyScale,
  TypographyVariant,
  ShadowScale,
  ShadowPreset,
  Tokens,
} from './theme';

export {
  lightTheme,
  darkTheme,
  ThemeProvider,
  useTheme,
  useThemeContext,
} from './theme';

export type {
  Theme,
  ColorSchemePreference,
} from './theme';

// ---- Hooks ------------------------------------------------------------------
export { useReducedMotion } from './hooks';

// ---- Primitives -----------------------------------------------------------
export {
  Box,
  Text,
  Button,
  Input,
  Avatar,
  Spinner,
  Skeleton,
  SkeletonCircle,
  SkeletonLine,
  SkeletonFeedCard,
  SkeletonProfileHeader,
  SkeletonChatRow,
  Divider,
  Sheet,
  GradientText,
} from './primitives';

export type {
  BoxProps,
  SurfaceVariant,
  TextProps,
  TextVariant,
  TextColor,
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  InputProps,
  AvatarProps,
  AvatarSize,
  SpinnerProps,
  SpinnerSize,
  SkeletonProps,
  SkeletonCircleProps,
  SkeletonLineProps,
  DividerProps,
  SheetProps,
  GradientTextProps,
} from './primitives';
