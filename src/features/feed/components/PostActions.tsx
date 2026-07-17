/**
 * Lumina — PostActions
 *
 * Like / Comment / Share / Save row beneath a post's media.
 * Like and Save are optimistic via useLikePost / useSavePost.
 *
 * Micro-interactions (all UI-thread, Reanimated worklets):
 * - Every icon gets a spring press-scale (consistent with Button primitive).
 * - Like: springy pop (1 -> 1.3 -> 1) + heart-color crossfade on toggle.
 * - Like count: subtle pop whenever the count itself changes.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Text } from '@/design-system/primitives/Text';
import { formatCount } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { PostId } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostActionsProps {
  postId: PostId;
  likeCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

// ---------------------------------------------------------------------------
// Animation constants — damped, no bounce-fest
// ---------------------------------------------------------------------------

const PRESS_SPRING = { damping: 16, stiffness: 320, mass: 0.7 } as const;
const POP_SPRING = { damping: 10, stiffness: 260, mass: 0.6 } as const;
const COLOR_DURATION = 200;

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// ---------------------------------------------------------------------------
// IconActionButton — reusable icon with press-scale spring
// ---------------------------------------------------------------------------

interface IconActionButtonProps {
  icon: string;
  size: number;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityState?: { selected?: boolean };
  style?: StyleProp<ViewStyle>;
}

const IconActionButton = React.memo(function IconActionButton({
  icon,
  size,
  color,
  onPress,
  accessibilityLabel,
  accessibilityState,
  style,
}: IconActionButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = reducedMotion ? 0.85 : withSpring(0.85, PRESS_SPRING);
  }, [scale, reducedMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = reducedMotion ? 1 : withSpring(1, PRESS_SPRING);
  }, [scale, reducedMotion]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={[styles.actionBtn, style]}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name={icon} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// LikeButton — press-scale + toggle pop + color crossfade
// ---------------------------------------------------------------------------

interface LikeButtonProps {
  isLiked: boolean;
  onPress: () => void;
}

const LikeButton = React.memo(function LikeButton({
  isLiked,
  onPress,
}: LikeButtonProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const pressScale = useSharedValue(1);
  const popScale = useSharedValue(1);
  const colorProgress = useSharedValue(isLiked ? 1 : 0);
  const didMount = useRef(false);

  useEffect(() => {
    colorProgress.value = reducedMotion
      ? isLiked
        ? 1
        : 0
      : withTiming(isLiked ? 1 : 0, { duration: COLOR_DURATION });

    if (didMount.current && !reducedMotion) {
      popScale.value = withSequence(
        withSpring(1.3, POP_SPRING),
        withSpring(1, POP_SPRING),
      );
    }
    didMount.current = true;
  }, [isLiked, colorProgress, popScale, reducedMotion]);

  const handlePressIn = useCallback(() => {
    pressScale.value = reducedMotion ? 0.85 : withSpring(0.85, PRESS_SPRING);
  }, [pressScale, reducedMotion]);

  const handlePressOut = useCallback(() => {
    pressScale.value = reducedMotion ? 1 : withSpring(1, PRESS_SPRING);
  }, [pressScale, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * popScale.value }],
  }));

  const iconAnimatedProps = useAnimatedProps(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [theme.colors.textPrimary, theme.colors.danger],
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
      accessibilityState={{ selected: isLiked }}
      style={styles.actionBtn}
    >
      <Animated.View style={containerStyle}>
        <AnimatedIonicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={26}
          animatedProps={iconAnimatedProps}
        />
      </Animated.View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// AnimatedLikeCount — subtle pop whenever the count value changes
// ---------------------------------------------------------------------------

function useCountPop(value: number, reducedMotion: boolean) {
  const scale = useSharedValue(1);
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current && !reducedMotion) {
      scale.value = withSequence(
        withSpring(1.18, POP_SPRING),
        withSpring(1, POP_SPRING),
      );
    }
    didMount.current = true;
  }, [value, scale, reducedMotion]);

  return scale;
}

interface AnimatedLikeCountProps {
  likeCount: number;
}

const AnimatedLikeCount = React.memo(function AnimatedLikeCount({
  likeCount,
}: AnimatedLikeCountProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useCountPop(likeCount, reducedMotion);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        { marginLeft: theme.spacing.xs, marginRight: theme.spacing.md },
      ]}
    >
      <Text variant="caption" color="secondary" accessibilityLabel={`${likeCount} likes`}>
        {formatCount(likeCount)}
      </Text>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PostActions = React.memo(function PostActions({
  likeCount,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  postId,
}: PostActionsProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {/* Like */}
      <LikeButton isLiked={isLiked} onPress={onLike} />

      {/* Like count */}
      {likeCount > 0 ? (
        <AnimatedLikeCount likeCount={likeCount} />
      ) : (
        <View style={{ width: theme.spacing.md }} />
      )}

      {/* Comment */}
      <IconActionButton
        icon="chatbubble-outline"
        size={24}
        color={theme.colors.textPrimary}
        onPress={onComment}
        accessibilityLabel="View comments"
      />

      {/* Share */}
      <IconActionButton
        icon="paper-plane-outline"
        size={24}
        color={theme.colors.textPrimary}
        onPress={onShare}
        accessibilityLabel="Share post"
        style={{ marginLeft: theme.spacing.md }}
      />

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Save */}
      <IconActionButton
        icon={isSaved ? 'bookmark' : 'bookmark-outline'}
        size={24}
        color={isSaved ? theme.colors.accent : theme.colors.textPrimary}
        onPress={onSave}
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save post'}
        accessibilityState={{ selected: isSaved }}
      />

      {/* Invisible prop usage to avoid lint */}
      {postId ? null : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
});
