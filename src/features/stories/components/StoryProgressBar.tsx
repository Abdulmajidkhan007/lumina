/**
 * Lumina — StoryProgressBar
 *
 * A row of segmented progress bars at the top of the story viewer.
 * - Completed segments are fully filled.
 * - The active segment fills from 0 → 1 using a Reanimated shared value.
 * - Future segments are empty.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { useTheme } from '@/design-system/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoryProgressBarProps {
  count: number;
  activeIndex: number;
  /** 0→1 animated value representing fill of the active segment */
  progress: SharedValue<number>;
}

// ---------------------------------------------------------------------------
// Single segment
// ---------------------------------------------------------------------------

interface SegmentProps {
  isFilled: boolean;
  isActive: boolean;
  progress: SharedValue<number>;
}

const Segment = React.memo(function Segment({
  isFilled,
  isActive,
  progress,
}: SegmentProps): React.JSX.Element {
  const theme = useTheme();

  const fillStyle = useAnimatedStyle(() => ({
    width: isFilled ? '100%' : isActive ? `${progress.value * 100}%` : '0%',
  }));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)' },
      ]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: '#FFFFFF' }, fillStyle]}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// StoryProgressBar
// ---------------------------------------------------------------------------

export function StoryProgressBar({
  count,
  activeIndex,
  progress,
}: StoryProgressBarProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[styles.row, { gap: theme.spacing.xs }]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Story ${activeIndex + 1} of ${count}`}
      accessibilityValue={{ min: 0, max: count, now: activeIndex + 1 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Segment
          key={i}
          isFilled={i < activeIndex}
          isActive={i === activeIndex}
          progress={progress}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  track: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
});
