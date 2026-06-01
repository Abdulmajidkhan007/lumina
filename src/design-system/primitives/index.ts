/**
 * Lumina Design System — Primitives barrel
 *
 * Import all shared UI primitives from here. Never import directly from
 * individual primitive files in screens or features.
 */

// Layout & surface
export { Box } from './Box';
export type { BoxProps, SurfaceVariant } from './Box';

// Typography
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor } from './Text';

// Interactive
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

// Media & identity
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

// Feedback & loading
export { Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize } from './Spinner';

export {
  Skeleton,
  SkeletonCircle,
  SkeletonLine,
  SkeletonFeedCard,
  SkeletonProfileHeader,
  SkeletonChatRow,
} from './Skeleton';
export type { SkeletonProps, SkeletonCircleProps, SkeletonLineProps } from './Skeleton';

// Structure
export { Divider } from './Divider';
export type { DividerProps } from './Divider';

export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';

// Accent helpers
export { GradientText } from './GradientText';
export type { GradientTextProps } from './GradientText';
