/**
 * Lumina — CommentItem
 *
 * Renders a single comment or reply:
 *   Avatar + username + text + timestamp + like button + reply affordance.
 * Replies are indented via `parentId` presence.
 * Supports inline reply expansion (placeholder: shows child count).
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { formatCount, formatRelativeTime } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { Comment } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommentItemProps {
  comment: Comment;
  onLike: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
  onAuthorPress: (userId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommentItem = React.memo(function CommentItem({
  comment,
  onLike,
  onReply,
  onAuthorPress,
}: CommentItemProps): React.JSX.Element {
  const theme = useTheme();
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const isReply = comment.parentId !== undefined;

  const handleLike = useCallback(() => {
    onLike(comment);
  }, [onLike, comment]);

  const handleReply = useCallback(() => {
    onReply(comment);
  }, [onReply, comment]);

  const handleAuthorPress = useCallback(() => {
    onAuthorPress(comment.author.id);
  }, [onAuthorPress, comment.author.id]);

  const toggleReplies = useCallback(() => {
    setRepliesExpanded((prev) => !prev);
  }, []);

  return (
    <View
      style={[
        styles.container,
        isReply && { paddingLeft: theme.spacing['3xl'] },
        { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
      ]}
    >
      {/* Avatar */}
      <Pressable
        onPress={handleAuthorPress}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={`View ${comment.author.username}'s profile`}
      >
        <Avatar
          uri={comment.author.avatarUrl ?? undefined}
          displayName={comment.author.displayName}
          size={isReply ? 'xs' : 'sm'}
          accessibilityLabel={`${comment.author.displayName}'s avatar`}
        />
      </Pressable>

      {/* Content column */}
      <View style={styles.content}>
        {/* Username + text */}
        <View style={styles.textRow}>
          <Pressable
            onPress={handleAuthorPress}
            hitSlop={hitSlop.sm}
            accessibilityRole="button"
            accessibilityLabel={`View ${comment.author.username}'s profile`}
          >
            <Text variant="caption" color="primary" style={styles.username}>
              {comment.author.username}
            </Text>
          </Pressable>
          <Text
            variant="callout"
            color="primary"
            style={{ marginLeft: theme.spacing.xs, flex: 1 }}
          >
            {comment.text}
          </Text>
        </View>

        {/* Meta row: timestamp + reply */}
        <View style={[styles.metaRow, { marginTop: theme.spacing.xxs }]}>
          <Text variant="caption" color="tertiary">
            {formatRelativeTime(comment.createdAt)}
          </Text>

          {comment.likeCount > 0 ? (
            <Text
              variant="caption"
              color="tertiary"
              style={{ marginLeft: theme.spacing.md }}
              accessibilityLabel={`${comment.likeCount} likes`}
            >
              {formatCount(comment.likeCount)}{' '}
              {comment.likeCount === 1 ? 'like' : 'likes'}
            </Text>
          ) : null}

          <Pressable
            onPress={handleReply}
            hitSlop={hitSlop.sm}
            style={{ marginLeft: theme.spacing.md }}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${comment.author.username}`}
          >
            <Text variant="caption" color="secondary">
              Reply
            </Text>
          </Pressable>
        </View>

        {/* View replies expander (top-level comments only) */}
        {!isReply && comment.replyCount > 0 ? (
          <Pressable
            onPress={toggleReplies}
            hitSlop={hitSlop.sm}
            style={[styles.repliesToggle, { marginTop: theme.spacing.xs }]}
            accessibilityRole="button"
            accessibilityLabel={
              repliesExpanded
                ? 'Hide replies'
                : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
            }
          >
            <View
              style={[
                styles.replyLine,
                { backgroundColor: theme.colors.border, width: theme.spacing['2xl'] },
              ]}
            />
            <Text variant="caption" color="secondary">
              {repliesExpanded
                ? 'Hide replies'
                : `View ${formatCount(comment.replyCount)} ${
                    comment.replyCount === 1 ? 'reply' : 'replies'
                  }`}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Like button */}
      <Pressable
        onPress={handleLike}
        hitSlop={hitSlop.sm}
        style={styles.likeBtn}
        accessibilityRole="button"
        accessibilityLabel={comment.isLikedByMe ? 'Unlike comment' : 'Like comment'}
        accessibilityState={{ selected: comment.isLikedByMe }}
      >
        <Ionicons
          name={comment.isLikedByMe ? 'heart' : 'heart-outline'}
          size={14}
          color={comment.isLikedByMe ? theme.colors.danger : theme.colors.textTertiary}
        />
      </Pressable>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles — layout only
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  username: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyLine: {
    height: 1,
  },
  likeBtn: {
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
});
