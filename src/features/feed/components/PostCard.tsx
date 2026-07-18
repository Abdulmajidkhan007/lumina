/**
 * Lumina — PostCard
 *
 * Full feed post card with:
 * - Header: avatar, username/location, "..." menu (Sheet with actions)
 * - Media: PostMediaPager (double-tap to like with Reanimated heart pop)
 * - Action row: like, comment, share, save (all optimistic)
 * - Like count, caption with "more" truncation, comments link, timestamp
 *
 * Memoized; stable callbacks only.
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Sheet } from '@/design-system/primitives/Sheet';
import { Divider } from '@/design-system/primitives/Divider';
import { RichCaption } from '@/components/RichCaption';
import { useLikePost } from '@/data/query/hooks/useLikePost';
import { useSavePost } from '@/data/query/hooks/useSavePost';
import { usersApi } from '@/data/api/client';
import { useUiStore } from '@/stores/ui.store';
import { formatCount, formatRelativeTime } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { Post } from '@/types/models';
import { PostMediaPager } from './PostMediaPager';
import { PostActions } from './PostActions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostCardProps {
  post: Post;
}

// ---------------------------------------------------------------------------
// Animation constants — damped springs, opacity+transform only
// ---------------------------------------------------------------------------

const MEDIA_PRESS_SPRING = { damping: 20, stiffness: 400, mass: 0.6 } as const;
const CARD_ENTERING = FadeInDown.duration(300).springify().damping(18);

// ---------------------------------------------------------------------------
// Caption with "more" truncation
// ---------------------------------------------------------------------------

const MAX_CAPTION_LINES = 2;

interface CaptionProps {
  username: string;
  caption: string | null;
  onUserPress: () => void;
  onHashtagPress: (tag: string) => void;
  onMentionPress: (username: string) => void;
}

const Caption = React.memo(function Caption({
  username,
  caption,
  onUserPress,
  onHashtagPress,
  onMentionPress,
}: CaptionProps): React.JSX.Element | null {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleExpand = useCallback(() => {
    setExpanded(true);
  }, []);

  if (caption == null || caption.trim() === '') return null;

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xs }}>
      <Text
        variant="callout"
        numberOfLines={expanded ? undefined : MAX_CAPTION_LINES}
        onPress={expanded ? undefined : handleExpand}
      >
        <Text
          variant="callout"
          onPress={onUserPress}
          accessibilityRole="link"
          accessibilityLabel={`View ${username}'s profile`}
          style={{ fontWeight: '600' }}
        >
          {username}
        </Text>
        {'  '}
        <RichCaption
          text={caption}
          variant="callout"
          onHashtagPress={onHashtagPress}
          onMentionPress={onMentionPress}
        />
      </Text>
      {!expanded ? (
        <Pressable onPress={handleExpand} hitSlop={hitSlop.sm}>
          <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            more
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Sheet action row
// ---------------------------------------------------------------------------

interface SheetActionProps {
  icon: string;
  label: string;
  color?: string;
  onPress: () => void;
}

const SheetAction = React.memo(function SheetAction({
  icon,
  label,
  color,
  onPress,
}: SheetActionProps): React.JSX.Element {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={styles.sheetAction}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={resolvedColor} />
      <Text
        variant="body"
        style={{ marginLeft: theme.spacing.md, color: resolvedColor }}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// PostCard
// ---------------------------------------------------------------------------

export const PostCard = React.memo(function PostCard({
  post,
}: PostCardProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const setPendingSearchQuery = useUiStore((s) => s.setPendingSearchQuery);

  const [menuOpen, setMenuOpen] = useState(false);

  const mediaScale = useSharedValue(1);
  const mediaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mediaScale.value }],
  }));

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const goToProfile = useCallback(() => {
    navigation.navigate('UserProfile', { id: post.author.id });
  }, [navigation, post.author.id]);

  const goToComments = useCallback(() => {
    navigation.navigate('Comments', { postId: post.id });
  }, [navigation, post.id]);

  const handleDoubleTapLike = useCallback(() => {
    if (!post.isLikedByMe) {
      likePost({ postId: post.id, liked: true });
    }
  }, [likePost, post.id, post.isLikedByMe]);

  const handleLike = useCallback(() => {
    likePost({ postId: post.id, liked: !post.isLikedByMe });
  }, [likePost, post.id, post.isLikedByMe]);

  const handleSave = useCallback(() => {
    savePost({ postId: post.id, saved: !post.isSavedByMe });
  }, [savePost, post.id, post.isSavedByMe]);

  const handleMediaPressIn = useCallback(() => {
    mediaScale.value = reducedMotion ? 0.98 : withSpring(0.98, MEDIA_PRESS_SPRING);
  }, [mediaScale, reducedMotion]);

  const handleMediaPressOut = useCallback(() => {
    mediaScale.value = reducedMotion ? 1 : withSpring(1, MEDIA_PRESS_SPRING);
  }, [mediaScale, reducedMotion]);

  const handleHashtagPress = useCallback(
    (tag: string) => {
      setPendingSearchQuery(`#${tag}`);
      navigation.navigate('Tabs', { screen: 'Search' });
    },
    [navigation, setPendingSearchQuery],
  );

  const handleMentionPress = useCallback(
    (username: string) => {
      void (async () => {
        const user = await usersApi.getUserByUsername(username);
        if (user) {
          navigation.navigate('UserProfile', { id: user.id });
        }
      })();
    },
    [navigation],
  );

  const handleShare = useCallback(() => {
    // TODO: share sheet integration
  }, []);

  const handleReport = useCallback(() => {
    closeMenu();
    // TODO: report flow
  }, [closeMenu]);

  const handleBlock = useCallback(() => {
    closeMenu();
    // TODO: block flow
  }, [closeMenu]);

  const handleShareFromMenu = useCallback(() => {
    closeMenu();
    handleShare();
  }, [closeMenu, handleShare]);

  const handleUnfollow = useCallback(() => {
    closeMenu();
    // TODO: unfollow
  }, [closeMenu]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Animated.View
      entering={reducedMotion ? undefined : CARD_ENTERING}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        theme.colorScheme === 'light' ? theme.shadows.sm : null,
      ]}
      accessibilityLabel={`Post by ${post.author.username}`}
    >
      {/* ---- Header ---- */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        <Pressable
          onPress={goToProfile}
          style={styles.authorRow}
          accessibilityRole="button"
          accessibilityLabel={`View ${post.author.username}'s profile`}
          hitSlop={hitSlop.sm}
        >
          <Avatar
            uri={post.author.avatarUrl ?? undefined}
            displayName={post.author.displayName}
            size="sm"
            accessibilityLabel={`${post.author.displayName}'s avatar`}
          />
          <View style={[styles.authorInfo, { marginLeft: theme.spacing.sm }]}>
            <Text variant="bodyStrong">
              {post.author.username}
              {post.author.isVerified ? (
                <Text variant="bodyStrong" color="accent"> ✓</Text>
              ) : null}
            </Text>
            {post.location != null && post.location.trim() !== '' ? (
              <Text variant="overline" color="secondary">
                {post.location}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* More menu */}
        <Pressable
          onPress={openMenu}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel="Post options"
          style={styles.moreBtn}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* ---- Media ---- */}
      {/* Pressable only provides visual press-scale feedback (no onPress) —
          PostMediaPager owns the double-tap-to-like gesture internally. */}
      <Pressable
        onPressIn={handleMediaPressIn}
        onPressOut={handleMediaPressOut}
        accessible={false}
      >
        <Animated.View style={mediaAnimatedStyle}>
          <PostMediaPager
            media={post.media}
            onDoubleTapLike={handleDoubleTapLike}
            isLiked={post.isLikedByMe}
          />
        </Animated.View>
      </Pressable>

      {/* ---- Actions ---- */}
      <View
        style={[
          styles.actionsRow,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        <PostActions
          postId={post.id}
          likeCount={post.likeCount}
          isLiked={post.isLikedByMe}
          isSaved={post.isSavedByMe}
          onLike={handleLike}
          onComment={goToComments}
          onShare={handleShare}
          onSave={handleSave}
        />
      </View>

      {/* ---- Caption ---- */}
      <Caption
        username={post.author.username}
        caption={post.caption}
        onUserPress={goToProfile}
        onHashtagPress={handleHashtagPress}
        onMentionPress={handleMentionPress}
      />

      {/* ---- Comments link ---- */}
      {post.commentCount > 0 ? (
        <Pressable
          onPress={goToComments}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel={`View all ${post.commentCount} comments`}
          style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xs }}
        >
          <Text variant="callout" color="secondary">
            View all {formatCount(post.commentCount)} comments
          </Text>
        </Pressable>
      ) : null}

      {/* ---- Timestamp ---- */}
      <Text
        variant="caption"
        color="tertiary"
        style={{
          paddingHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.xs,
          marginBottom: theme.spacing.sm,
        }}
      >
        {formatRelativeTime(post.createdAt)}
      </Text>

      {/* ---- Options Sheet ---- */}
      <Sheet visible={menuOpen} onDismiss={closeMenu}>
        <SheetAction
          icon="flag-outline"
          label="Report"
          color={theme.colors.danger}
          onPress={handleReport}
        />
        <Divider />
        <SheetAction
          icon="ban-outline"
          label="Block"
          color={theme.colors.danger}
          onPress={handleBlock}
        />
        <Divider />
        <SheetAction
          icon="paper-plane-outline"
          label="Share"
          onPress={handleShareFromMenu}
        />
        <Divider />
        <SheetAction
          icon="person-remove-outline"
          label="Unfollow"
          onPress={handleUnfollow}
        />
      </Sheet>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorInfo: {
    justifyContent: 'center',
  },
  moreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    // padding applied inline
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
