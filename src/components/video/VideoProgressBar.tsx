/**
 * Lumina — VideoProgressBar
 *
 * Thin playback progress line pinned to the bottom of a video. Fed by a
 * shared value (0–1) so position updates never re-render React.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

const TRACK = 'rgba(255,255,255,0.25)';
const FILL = '#FFFFFF';

export interface VideoProgressBarProps {
  progress: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}

export function VideoProgressBar({ progress, style }: VideoProgressBarProps): React.JSX.Element {
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={[styles.track, style]} pointerEvents="none" accessibilityElementsHidden>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: TRACK,
  },
  fill: {
    height: '100%',
    backgroundColor: FILL,
  },
});
