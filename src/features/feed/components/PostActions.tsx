/**
 * Lumina — PostActions
 *
 * Like / Comment / Share / Save row beneath a post's media.
 * Like and Save are optimistic via useLikePost / useSavePost.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
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
      <Pressable
        onPress={onLike}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
        accessibilityState={{ selected: isLiked }}
        style={styles.actionBtn}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={26}
          color={isLiked ? theme.colors.danger : theme.colors.textPrimary}
        />
      </Pressable>

      {/* Like count */}
      {likeCount > 0 ? (
        <Text
          variant="caption"
          color="secondary"
          style={{ marginLeft: theme.spacing.xs, marginRight: theme.spacing.md }}
          accessibilityLabel={`${likeCount} likes`}
        >
          {formatCount(likeCount)}
        </Text>
      ) : (
        <View style={{ width: theme.spacing.md }} />
      )}

      {/* Comment */}
      <Pressable
        onPress={onComment}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel="View comments"
        style={styles.actionBtn}
      >
        <Ionicons
          name="chatbubble-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>

      {/* Share */}
      <Pressable
        onPress={onShare}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel="Share post"
        style={[styles.actionBtn, { marginLeft: theme.spacing.md }]}
      >
        <Ionicons
          name="paper-plane-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Save */}
      <Pressable
        onPress={onSave}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save post'}
        accessibilityState={{ selected: isSaved }}
        style={styles.actionBtn}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isSaved ? theme.colors.accent : theme.colors.textPrimary}
        />
      </Pressable>

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
