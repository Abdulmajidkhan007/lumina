/**
 * Lumina — PostDetail
 *
 * Full-post renderer used inside the post/[id] screen.
 * Includes:
 *   - Author row (Avatar + username -> user profile + "…" menu Sheet)
 *   - Media (PostMediaPager with double-tap like + Reanimated heart pop)
 *   - Action row (like/comment/share/save — optimistic)
 *   - Like count, caption, "view all N comments" link, timestamp
 *   - Optional preview of first 2-3 comments
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import { Sheet } from '@/design-system/primitives/Sheet';
import { PostActions } from '@/features/feed/components/PostActions';
import { PostMediaPager } from '@/features/feed/components/PostMediaPager';
import { useLikePost } from '@/data/query/hooks/useLikePost';
import { useSavePost } from '@/data/query/hooks/useSavePost';
import { formatCount, formatRelativeTime } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { Post, Comment } from '@/types/models';
import { CommentItem } from './CommentItem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostDetailProps {
  post: Post;
  /** Preview comments to show beneath the caption (max 3) */
  previewComments?: Comment[];
  onViewAllComments: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostDetail({
  post,
  previewComments = [],
  onViewAllComments,
}: PostDetailProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();

  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Handlers ----

  const handleLike = useCallback(() => {
    likePost({ postId: post.id, liked: !post.isLikedByMe });
  }, [likePost, post.id, post.isLikedByMe]);

  const handleDoubleTapLike = useCallback(() => {
    if (!post.isLikedByMe) {
      likePost({ postId: post.id, liked: true });
    }
  }, [likePost, post.id, post.isLikedByMe]);

  const handleSave = useCallback(() => {
    savePost({ postId: post.id, saved: !post.isSavedByMe });
  }, [savePost, post.id, post.isSavedByMe]);

  const handleShare = useCallback(() => {
    // Share sheet — no-op placeholder (native share would go here)
  }, []);

  const handleAuthorPress = useCallback(() => {
    router.push(`/(protected)/user/${post.author.id}`);
  }, [router, post.author.id]);

  const handleMenuOpen = useCallback(() => setMenuOpen(true), []);
  const handleMenuClose = useCallback(() => setMenuOpen(false), []);

  // CommentItem callbacks (for preview comments — these are view-only)
  const handlePreviewCommentLike = useCallback((_comment: Comment) => {
    // Preview likes are read-only; direct to comments screen for interaction
    onViewAllComments();
  }, [onViewAllComments]);

  const handlePreviewCommentReply = useCallback((_comment: Comment) => {
    onViewAllComments();
  }, [onViewAllComments]);

  const handlePreviewCommentAuthorPress = useCallback((userId: string) => {
    router.push(`/(protected)/user/${userId}`);
  }, [router]);

  // ---- Preview comments (capped at 3) ----
  const visiblePreviews = previewComments.slice(0, 3);

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Author row */}
        <View
          style={[
            styles.authorRow,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        >
          <Pressable
            onPress={handleAuthorPress}
            style={styles.authorLeft}
            hitSlop={hitSlop.sm}
            accessibilityRole="button"
            accessibilityLabel={`View ${post.author.username}'s profile`}
          >
            <Avatar
              uri={post.author.avatarUrl ?? undefined}
              displayName={post.author.displayName}
              size="sm"
              accessibilityLabel={`${post.author.displayName}'s avatar`}
            />
            <View style={{ marginLeft: theme.spacing.sm }}>
              <Text variant="bodyStrong" color="primary">
                {post.author.username}
              </Text>
              {post.location !== undefined && post.location !== '' ? (
                <Text variant="overline" color="secondary">
                  {post.location}
                </Text>
              ) : null}
            </View>
            {post.author.isVerified ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.colors.accent}
                style={{ marginLeft: theme.spacing.xs }}
                accessibilityLabel="Verified account"
              />
            ) : null}
          </Pressable>

          {/* More menu button */}
          <Pressable
            onPress={handleMenuOpen}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>

        {/* Media */}
        <PostMediaPager
          media={post.media}
          onDoubleTapLike={handleDoubleTapLike}
          isLiked={post.isLikedByMe}
        />

        {/* Action row */}
        <View
          style={[
            styles.actionsWrap,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.sm,
            },
          ]}
        >
          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            isLiked={post.isLikedByMe}
            isSaved={post.isSavedByMe}
            onLike={handleLike}
            onComment={onViewAllComments}
            onShare={handleShare}
            onSave={handleSave}
          />
        </View>

        {/* Like count */}
        {post.likeCount > 0 ? (
          <View
            style={[
              styles.likeCount,
              { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xs },
            ]}
          >
            <Text variant="bodyStrong" color="primary">
              {formatCount(post.likeCount)}{' '}
              {post.likeCount === 1 ? 'like' : 'likes'}
            </Text>
          </View>
        ) : null}

        {/* Caption */}
        {post.caption !== null && post.caption !== '' ? (
          <View
            style={[
              styles.caption,
              {
                paddingHorizontal: theme.spacing.lg,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            <Text variant="callout" color="primary">
              <Text variant="bodyStrong" color="primary">
                {post.author.username}
              </Text>
              {'  '}
              {post.caption}
            </Text>
          </View>
        ) : null}

        {/* View all comments */}
        {post.commentCount > 0 ? (
          <Pressable
            onPress={onViewAllComments}
            hitSlop={hitSlop.sm}
            accessibilityRole="button"
            accessibilityLabel={`View all ${post.commentCount} comments`}
            style={[
              styles.viewAllComments,
              {
                paddingHorizontal: theme.spacing.lg,
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            <Text variant="callout" color="tertiary">
              View all {formatCount(post.commentCount)} comments
            </Text>
          </Pressable>
        ) : null}

        {/* Preview comments */}
        {visiblePreviews.length > 0 ? (
          <View style={{ marginTop: theme.spacing.xs }}>
            {visiblePreviews.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handlePreviewCommentLike}
                onReply={handlePreviewCommentReply}
                onAuthorPress={handlePreviewCommentAuthorPress}
              />
            ))}
          </View>
        ) : null}

        {/* Timestamp */}
        <View
          style={[
            styles.timestamp,
            {
              paddingHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.sm,
              paddingBottom: theme.spacing['2xl'],
            },
          ]}
        >
          <Text variant="caption" color="tertiary">
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>

        <Divider />
      </ScrollView>

      {/* Author action sheet */}
      <Sheet visible={menuOpen} onDismiss={handleMenuClose}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
          <Pressable
            style={[styles.sheetRow, { paddingVertical: theme.spacing.lg }]}
            onPress={handleMenuClose}
            accessibilityRole="button"
            accessibilityLabel="Report post"
          >
            <Ionicons name="flag-outline" size={20} color={theme.colors.danger} />
            <Text
              variant="body"
              color="danger"
              style={{ marginLeft: theme.spacing.sm }}
            >
              Report
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sheetRow, { paddingVertical: theme.spacing.lg }]}
            onPress={handleMenuClose}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} />
            <Text
              variant="body"
              color="primary"
              style={{ marginLeft: theme.spacing.sm }}
            >
              Share
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sheetRow, { paddingVertical: theme.spacing.lg }]}
            onPress={handleMenuClose}
            accessibilityRole="button"
            accessibilityLabel="Copy link to post"
          >
            <Ionicons name="link-outline" size={20} color={theme.colors.textPrimary} />
            <Text
              variant="body"
              color="primary"
              style={{ marginLeft: theme.spacing.sm }}
            >
              Copy link
            </Text>
          </Pressable>
        </View>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionsWrap: {},
  likeCount: {},
  caption: {},
  viewAllComments: {},
  timestamp: {},
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
