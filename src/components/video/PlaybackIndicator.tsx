/**
 * Lumina — PlaybackIndicator
 *
 * Centered play/pause glyph that pops in when the user toggles playback and
 * stays while paused (Instagram-style). Also shows a "2x" badge while the
 * hold-to-speed-up gesture is active.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '@/design-system/primitives/Text';

const BG = 'rgba(0,0,0,0.45)';
const ICON = '#FFFFFF';

export interface PlaybackIndicatorProps {
  paused: boolean;
  fast?: boolean;
  size?: number;
}

export function PlaybackIndicator({ paused, fast = false, size = 72 }: PlaybackIndicatorProps): React.JSX.Element {
  const scale = useSharedValue(paused ? 1 : 0);

  useEffect(() => {
    scale.value = paused ? withSpring(1, { damping: 12, stiffness: 220 }) : withTiming(0, { duration: 150 });
  }, [paused, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: 0.6 + scale.value * 0.4 }],
  }));

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.center]} pointerEvents="none">
      <Animated.View
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, iconStyle]}
      >
        <Ionicons name="play" size={size * 0.5} color={ICON} style={styles.playNudge} />
      </Animated.View>
      {fast ? (
        <View style={styles.fastBadge}>
          <Ionicons name="play-forward" size={14} color={ICON} />
          <Text variant="caption" style={styles.fastText}>
            2x
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  playNudge: {
    marginLeft: 4,
  },
  fastBadge: {
    position: 'absolute',
    top: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: BG,
  },
  fastText: {
    color: ICON,
    fontWeight: '700',
  },
});
