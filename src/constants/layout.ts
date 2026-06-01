/**
 * Lumina — Layout constants
 *
 * Screen dimensions, hit slops, standard heights, and media aspect ratios.
 * All values are derived from token-aligned sizes or platform norms —
 * no magic numbers in screens.
 */

import { Dimensions, Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Screen dimensions
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  /** Shorthand: half screen width */
  halfWidth: SCREEN_WIDTH / 2,
} as const;

/**
 * Subscribe to dimension changes at component level via useDimensions hook
 * or Dimensions.addEventListener in effects — this constant reflects the
 * value at module load time.
 */

// ---------------------------------------------------------------------------
// Common hit slop
// ---------------------------------------------------------------------------

export const hitSlop = {
  /** 8px inset — icon buttons in dense layouts */
  sm: { top: 8, right: 8, bottom: 8, left: 8 },
  /** 12px inset — standard touch targets */
  md: { top: 12, right: 12, bottom: 12, left: 12 },
  /** 16px inset — small or edge-adjacent controls */
  lg: { top: 16, right: 16, bottom: 16, left: 16 },
} as const;

// ---------------------------------------------------------------------------
// Navigation chrome heights
// ---------------------------------------------------------------------------

export const headerHeight = {
  /** Standard navigation bar height */
  default: Platform.OS === 'ios' ? 44 : 56,
  /** Tall header with search or segmented control */
  large: Platform.OS === 'ios' ? 96 : 104,
} as const;

export const tabBarHeight = {
  /** Standard tab bar (without extra bottom safe area inset) */
  default: Platform.OS === 'ios' ? 49 : 56,
  /** Typical additional safe-area gap below tab bar on newer iPhones */
  safeAreaExtra: Platform.OS === 'ios' ? 34 : 0,
} as const;

// ---------------------------------------------------------------------------
// Story ring dimensions
// ---------------------------------------------------------------------------

export const storyRing = {
  /** Diameter of the avatar shown in the stories rail */
  avatarSize: 64,
  /** Visible ring thickness */
  borderWidth: 2.5,
  /** White gap between ring gradient and avatar image */
  gap: 2,
  /** Total outer diameter (avatar + 2 * (borderWidth + gap)) */
  totalSize: 64 + (2.5 + 2) * 2,
} as const;

// ---------------------------------------------------------------------------
// Feed media aspect ratios
// ---------------------------------------------------------------------------

export const aspectRatio = {
  /** Classic square post — 1:1 */
  square: 1,
  /** Portrait post — 4:5 */
  portrait: 4 / 5,
  /** Landscape post — 1.91:1 */
  landscape: 1.91,
  /** Reels / vertical video — 9:16 */
  reel: 9 / 16,
  /** Stories — 9:16 */
  story: 9 / 16,
} as const;

// ---------------------------------------------------------------------------
// Feed card media height helpers
// ---------------------------------------------------------------------------

/**
 * Returns the pixel height for a feed card image at a given aspect ratio
 * given a content width. Defaults to full-bleed screen width media.
 */
export function feedMediaHeight(
  ratio: keyof typeof aspectRatio = 'portrait',
  contentWidth: number = SCREEN_WIDTH,
): number {
  return contentWidth / aspectRatio[ratio];
}

// ---------------------------------------------------------------------------
// Grid layout helpers
// ---------------------------------------------------------------------------

export const grid = {
  /** Standard horizontal padding for full-bleed content */
  horizontalPadding: 16,
  /** Column gutter in profile grid / explore */
  columnGap: 2,
  /** Number of columns in profile grid */
  profileColumns: 3,
  /** Computed cell width for a 3-column grid */
  profileCellWidth: (SCREEN_WIDTH - 2 * 2) / 3, // 2 gaps of 2px
} as const;
