/**
 * Lumina — Skeleton & Shimmer primitives
 *
 * Animated shimmer using Reanimated 3. Theme-aware colors.
 *
 * Exports:
 *   Skeleton        — base rectangular block (configurable width/height/radius)
 *   SkeletonCircle  — circular skeleton (avatar / icon placeholder)
 *   SkeletonLine    — single text-line placeholder
 *
 * Shimmer presets for composed layouts:
 *   SkeletonFeedCard     — feed post card placeholder
 *   SkeletonProfileHeader— profile screen header placeholder
 *   SkeletonChatRow      — chat list row placeholder
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../theme';
import type { RadiiScale } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Shimmer animation constants
// ---------------------------------------------------------------------------

const SHIMMER_DURATION = 1500;
const SHIMMER_EASING = Easing.inOut(Easing.quad);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: keyof RadiiScale | number;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonCircleProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonLineProps {
  /** Fractional width 0–1, e.g. 0.75 = 75% */
  widthFraction?: number;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// useShimmer hook — shared animation logic
// ---------------------------------------------------------------------------

function useShimmer() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION, easing: SHIMMER_EASING }),
      -1,
      false,
    );
  }, [progress]);

  return progress;
}

// ---------------------------------------------------------------------------
// ShimmerOverlay — internal reusable shimmer sweep
// ---------------------------------------------------------------------------

interface ShimmerOverlayProps {
  highlightColor: string;
}

function ShimmerOverlay({ highlightColor }: ShimmerOverlayProps): React.JSX.Element {
  const progress = useShimmer();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-200, 200]),
      },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]} pointerEvents="none">
      <LinearGradient
        // Wider transparent shoulders + a softer peak read as a gentler,
        // less "flashy" sweep than a hard-edged 3-stop gradient.
        colors={['transparent', 'transparent', highlightColor, 'transparent', 'transparent']}
        locations={[0, 0.35, 0.5, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton — base block
// ---------------------------------------------------------------------------

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'md',
  style,
}: SkeletonProps): React.JSX.Element {
  const theme = useTheme();

  const resolvedRadius =
    typeof radius === 'number' ? radius : theme.radii[radius];

  return (
    <View
      style={[
        {
          width: width as number | `${number}%`,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: theme.colors.skeletonBase,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityRole="none"
      importantForAccessibility="no"
    >
      <ShimmerOverlay highlightColor={theme.colors.skeletonHighlight} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCircle
// ---------------------------------------------------------------------------

export function SkeletonCircle({ size = 44, style }: SkeletonCircleProps): React.JSX.Element {
  return (
    <Skeleton
      width={size}
      height={size}
      radius={size / 2}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonLine
// ---------------------------------------------------------------------------

export function SkeletonLine({ widthFraction = 1, style }: SkeletonLineProps): React.JSX.Element {
  return (
    <Skeleton
      width={`${widthFraction * 100}%`}
      height={14}
      radius="sm"
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonFeedCard — feed post placeholder
// ---------------------------------------------------------------------------

export function SkeletonFeedCard(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.feedCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
        },
      ]}
    >
      {/* Header row: avatar + name + follow */}
      <View style={styles.row}>
        <SkeletonCircle size={40} />
        <View style={[styles.col, { marginLeft: theme.spacing.sm, flex: 1 }]}>
          <SkeletonLine widthFraction={0.45} />
          <SkeletonLine widthFraction={0.3} style={{ marginTop: theme.spacing.xs }} />
        </View>
      </View>

      {/* Media placeholder */}
      <Skeleton
        width="100%"
        height={280}
        radius="lg"
        style={{ marginTop: theme.spacing.md }}
      />

      {/* Actions row */}
      <View style={[styles.row, { marginTop: theme.spacing.md, gap: theme.spacing.sm }]}>
        <SkeletonCircle size={24} />
        <SkeletonCircle size={24} />
        <SkeletonCircle size={24} />
      </View>

      {/* Caption lines */}
      <SkeletonLine widthFraction={0.9} style={{ marginTop: theme.spacing.sm }} />
      <SkeletonLine widthFraction={0.65} style={{ marginTop: theme.spacing.xs }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonProfileHeader — profile screen header
// ---------------------------------------------------------------------------

export function SkeletonProfileHeader(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={[styles.profileHeader, { padding: theme.spacing.lg }]}>
      {/* Avatar */}
      <SkeletonCircle size={88} />

      {/* Stats row */}
      <View style={[styles.row, { marginTop: theme.spacing.lg, gap: theme.spacing['3xl'] }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.col, { alignItems: 'center' }]}>
            <SkeletonLine widthFraction={0.6} style={{ width: 40 }} />
            <SkeletonLine widthFraction={0.4} style={{ width: 32, marginTop: theme.spacing.xs }} />
          </View>
        ))}
      </View>

      {/* Name + bio */}
      <SkeletonLine widthFraction={0.4} style={{ marginTop: theme.spacing.lg, width: 120 }} />
      <SkeletonLine widthFraction={0.8} style={{ marginTop: theme.spacing.sm }} />
      <SkeletonLine widthFraction={0.6} style={{ marginTop: theme.spacing.xs }} />

      {/* Action buttons */}
      <View style={[styles.row, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Skeleton width="48%" height={36} radius="2xl" />
        <Skeleton width="48%" height={36} radius="2xl" />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonChatRow — chat list item
// ---------------------------------------------------------------------------

export function SkeletonChatRow(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          alignItems: 'center',
        },
      ]}
    >
      <SkeletonCircle size={52} />
      <View style={[styles.col, { flex: 1, gap: theme.spacing.xs }]}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <SkeletonLine widthFraction={0.4} style={{ width: 100 }} />
          <SkeletonLine widthFraction={0.2} style={{ width: 48 }} />
        </View>
        <SkeletonLine widthFraction={0.75} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — layout only
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  feedCard: {
    // shadows applied inline from theme
  },
  profileHeader: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flexDirection: 'column',
  },
});
