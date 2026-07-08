/**
 * Lumina — ReelActions
 *
 * Vertical column of interaction buttons rendered on the right side of a
 * fullscreen reel: like (optimistic heart pop), comment count, share, save
 * (optimistic), and author avatar.
 *
 * All callbacks are stable; component is memoized.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { useTheme } from '@/design-system/theme';
import { formatCount } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { ReelId, UserSummary } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReelActionsProps {
  reelId: ReelId;
  author: UserSummary;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (reelId: ReelId, liked: boolean) => void;
  onComment: () => void;
  onShare: () => void;
  onSave: (reelId: ReelId, saved: boolean) => void;
  onAvatarPress: () => void;
}

// ---------------------------------------------------------------------------
// Heart pop animation config
// ---------------------------------------------------------------------------

const HEART_SPRING = { damping: 10, stiffness: 400 } as const;

// ---------------------------------------------------------------------------
// ActionButton — single icon + label button
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  icon: string;
  label: string;
  count?: number;
  color?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilitySelected?: boolean;
}

const ActionButton = React.memo(function ActionButton({
  icon,
  count,
  color,
  onPress,
  accessibilityLabel,
  accessibilitySelected,
  label,
}: ActionButtonProps): React.JSX.Element {
  const resolvedColor = color ?? '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop.md}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={
        accessibilitySelected !== undefined
          ? { selected: accessibilitySelected }
          : undefined
      }
      style={styles.actionBtn}
    >
      <Ionicons name={icon} size={28} color={resolvedColor} />
      {count !== undefined && count > 0 ? (
        <Text
          variant="caption"
          style={[styles.actionCount, { color: '#FFFFFF' }]}
          accessibilityLabel={`${count} ${label}`}
        >
          {formatCount(count)}
        </Text>
      ) : null}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// ReelActions
// ---------------------------------------------------------------------------

export const ReelActions = React.memo(function ReelActions({
  reelId,
  author,
  likeCount,
  commentCount,
  shareCount,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  onAvatarPress,
}: ReelActionsProps): React.JSX.Element {
  const theme = useTheme();
  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = useCallback(() => {
    if (!isLiked) {
      heartScale.value = withSequence(
        withSpring(1.4, HEART_SPRING),
        withTiming(1, { duration: 200 }),
      );
    }
    onLike(reelId, !isLiked);
  }, [isLiked, reelId, onLike, heartScale]);

  const handleSave = useCallback(() => {
    onSave(reelId, !isSaved);
  }, [isSaved, reelId, onSave]);

  return (
    <View style={styles.container}>
      {/* Author avatar */}
      <Pressable
        onPress={onAvatarPress}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={`View ${author.username}'s profile`}
        style={styles.avatarWrapper}
      >
        <Avatar
          uri={author.avatarUrl ?? undefined}
          displayName={author.displayName}
          size="md"
          accessibilityLabel={`${author.displayName}'s avatar`}
        />
        {/* Plus badge */}
        <View style={[styles.plusBadge, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name="add" size={10} color="#FFFFFF" />
        </View>
      </Pressable>

      {/* Like */}
      <Animated.View style={heartAnimatedStyle}>
        <ActionButton
          icon={isLiked ? 'heart' : 'heart-outline'}
          label="likes"
          count={likeCount}
          color={isLiked ? theme.colors.danger : '#FFFFFF'}
          onPress={handleLike}
          accessibilityLabel={isLiked ? 'Unlike reel' : 'Like reel'}
          accessibilitySelected={isLiked}
        />
      </Animated.View>

      {/* Comment */}
      <ActionButton
        icon="chatbubble-ellipses-outline"
        label="comments"
        count={commentCount}
        onPress={onComment}
        accessibilityLabel="View comments"
      />

      {/* Share */}
      <ActionButton
        icon="paper-plane-outline"
        label="shares"
        count={shareCount}
        onPress={onShare}
        accessibilityLabel="Share reel"
      />

      {/* Save */}
      <ActionButton
        icon={isSaved ? 'bookmark' : 'bookmark-outline'}
        label="saved"
        color={isSaved ? theme.colors.accent : '#FFFFFF'}
        onPress={handleSave}
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save reel'}
        accessibilitySelected={isSaved}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
    paddingBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  plusBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontWeight: '600',
  },
});
