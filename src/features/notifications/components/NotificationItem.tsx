/**
 * Lumina — NotificationItem
 *
 * Renders a single notification with discriminated union logic per type:
 *   - like:    actor avatar + rich text + post thumbnail (right)
 *   - comment: actor avatar + rich text + post thumbnail (right)
 *   - mention: actor avatar + rich text + post thumbnail (right)
 *   - follow:  actor avatar + rich text + Follow-back button (right)
 *
 * Unread items get a subtle accent-tinted background.
 * Tapping the item navigates:
 *   - avatar / name  -> /(protected)/user/[id]
 *   - post thumbnail -> /(protected)/post/[id]
 *
 * Memoized. No `any`. Exhaustive switch — TS will error if a union arm is missed.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from '@/components/Image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import { useRespondToCollab } from '@/data/query/hooks/useRespondToCollab';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type {
  Notification,
  LikeNotification,
  CommentNotification,
  FollowNotification,
  MentionNotification,
  CollabInviteNotification,
  NotificationPostPreview,
  PostId,
} from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationItemProps {
  notification: Notification;
}

// ---------------------------------------------------------------------------
// Post thumbnail — right-side image for like/comment/mention
// ---------------------------------------------------------------------------

const THUMB_SIZE = 52;

interface PostThumbProps {
  preview: NotificationPostPreview;
  onPress: () => void;
}

const PostThumb = React.memo(function PostThumb({
  preview,
  onPress,
}: PostThumbProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel="View post"
      style={[
        styles.thumb,
        {
          borderRadius: theme.radii.md,
          overflow: 'hidden',
        },
      ]}
    >
      <Image
        source={{ uri: preview.thumbnailUri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={150}
        accessibilityLabel="Post thumbnail"
      />
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Rich text body helpers
// ---------------------------------------------------------------------------

interface RichTextProps {
  username: string;
  children: React.ReactNode;
  time: string;
  onUserPress: () => void;
}

const RichText = React.memo(function RichText({
  username,
  children,
  time,
  onUserPress,
}: RichTextProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.textBlock}>
      <Text variant="callout" color="primary" style={styles.body}>
        <Text
          variant="callout"
          onPress={onUserPress}
          accessibilityRole="link"
          accessibilityLabel={`View ${username}'s profile`}
          style={{ fontWeight: '600' }}
        >
          {username}
        </Text>
        {children}
      </Text>
      <Text
        variant="caption"
        color="tertiary"
        style={{ marginTop: theme.spacing.xxs }}
      >
        {time}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Per-type renderers — all receive common props
// ---------------------------------------------------------------------------

interface CommonProps {
  onAvatarPress: () => void;
  time: string;
}

function renderLike(
  n: LikeNotification,
  { onAvatarPress, time }: CommonProps,
  onThumbPress: () => void,
): React.JSX.Element {
  return (
    <>
      <RichText
        username={n.actor.username}
        time={time}
        onUserPress={onAvatarPress}
      >
        {' liked your post.'}
      </RichText>
      <PostThumb preview={n.postPreview} onPress={onThumbPress} />
    </>
  );
}

function renderComment(
  n: CommentNotification,
  { onAvatarPress, time }: CommonProps,
  onThumbPress: () => void,
): React.JSX.Element {
  return (
    <>
      <RichText
        username={n.actor.username}
        time={time}
        onUserPress={onAvatarPress}
      >
        {` commented: ${n.commentText}`}
      </RichText>
      <PostThumb preview={n.postPreview} onPress={onThumbPress} />
    </>
  );
}

function renderMention(
  n: MentionNotification,
  { onAvatarPress, time }: CommonProps,
  onThumbPress: () => void,
): React.JSX.Element {
  const contextSuffix =
    n.mentionContext != null && n.mentionContext.trim() !== ''
      ? `: "${n.mentionContext}"`
      : '.';
  return (
    <>
      <RichText
        username={n.actor.username}
        time={time}
        onUserPress={onAvatarPress}
      >
        {` mentioned you${contextSuffix}`}
      </RichText>
      <PostThumb preview={n.postPreview} onPress={onThumbPress} />
    </>
  );
}

function renderFollow(
  n: FollowNotification,
  { onAvatarPress, time }: CommonProps,
  onFollowBack: () => void,
  isFollowingBack: boolean,
  isFollowPending: boolean,
): React.JSX.Element {
  return (
    <>
      <RichText
        username={n.actor.username}
        time={time}
        onUserPress={onAvatarPress}
      >
        {' started following you.'}
      </RichText>
      <Button
        label={isFollowingBack ? 'Following' : 'Follow'}
        variant={isFollowingBack ? 'secondary' : 'primary'}
        size="sm"
        loading={isFollowPending}
        onPress={onFollowBack}
        accessibilityLabel={
          isFollowingBack
            ? `Unfollow ${n.actor.username}`
            : `Follow ${n.actor.username} back`
        }
      />
    </>
  );
}

/** Collab invite: Accept / Decline, or the recorded answer. */
function CollabInvite({
  n,
  time,
  onAvatarPress,
  onThumbPress,
}: {
  n: CollabInviteNotification;
  time: string;
  onAvatarPress: () => void;
  onThumbPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const respond = useRespondToCollab();
  const answer = (accept: boolean) =>
    respond.mutate({ notificationId: n.id, postId: n.postPreview.postId as PostId, accept });

  return (
    <View style={styles.collabBlock}>
      <View style={styles.collabTop}>
        <RichText username={n.actor.username} time={time} onUserPress={onAvatarPress}>
          {t('collab.invited')}
        </RichText>
        <PostThumb preview={n.postPreview} onPress={onThumbPress} />
      </View>
      {n.response ? (
        <Text variant="caption" color={n.response === 'accepted' ? 'accent' : 'secondary'}>
          {n.response === 'accepted' ? t('collab.accepted') : t('collab.declined')}
        </Text>
      ) : (
        <View style={[styles.collabActions, { gap: theme.spacing.sm }]}>
          <Button
            label={t('collab.accept')}
            variant="primary"
            size="sm"
            style={styles.collabButton}
            loading={respond.isPending && respond.variables?.accept === true}
            disabled={respond.isPending}
            onPress={() => answer(true)}
          />
          <Button
            label={t('collab.decline')}
            variant="secondary"
            size="sm"
            style={styles.collabButton}
            loading={respond.isPending && respond.variables?.accept === false}
            disabled={respond.isPending}
            onPress={() => answer(false)}
          />
        </View>
      )}
      {respond.isError ? (
        <Text variant="caption" color="danger">
          {t('collab.error')}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

export const NotificationItem = React.memo(
  function NotificationItem({
    notification,
  }: NotificationItemProps): React.JSX.Element {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
    const { mutate: followUser, isPending: isFollowPending } = useFollowUser();

    // We track follow-back state locally — the optimistic mutation updates the
    // user cache but we don't re-query the full user here to avoid extra fetches.
    // The button reads from local state seeded as "not following" (notifications
    // from someone you follow would not appear as "started following you").
    const [isFollowingBack, setIsFollowingBack] = React.useState(false);

    const onAvatarPress = useCallback(() => {
      navigation.navigate('UserProfile', { id: notification.actor.id });
    }, [navigation, notification.actor.id]);

    const onThumbPress = useCallback(
      (postId: string) => () => {
        navigation.navigate('PostDetail', { id: postId });
      },
      [navigation],
    );

    const onFollowBack = useCallback(() => {
      const next = !isFollowingBack;
      setIsFollowingBack(next);
      followUser({ userId: notification.actor.id, follow: next });
    }, [followUser, isFollowingBack, notification.actor.id]);

    const time = formatRelativeTime(notification.createdAt);

    const commonProps: CommonProps = { onAvatarPress, time };

    // Derive subtle unread tint — thin overlay of accent at low opacity
    const unreadBg: ViewStyle | null = !notification.read
      ? {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? 'rgba(107, 91, 255, 0.08)' // violet tint for dark
              : 'rgba(107, 91, 255, 0.05)', // violet tint for light
        }
      : null;

    // Exhaustive switch — TypeScript will error if a union arm is missing
    let rightContent: React.JSX.Element;
    switch (notification.type) {
      case 'like':
        rightContent = renderLike(
          notification,
          commonProps,
          onThumbPress(notification.postPreview.postId),
        );
        break;
      case 'comment':
        rightContent = renderComment(
          notification,
          commonProps,
          onThumbPress(notification.postPreview.postId),
        );
        break;
      case 'mention':
        rightContent = renderMention(
          notification,
          commonProps,
          onThumbPress(notification.postPreview.postId),
        );
        break;
      case 'follow':
        rightContent = renderFollow(
          notification,
          commonProps,
          onFollowBack,
          isFollowingBack,
          isFollowPending,
        );
        break;
      case 'collab_invite':
        rightContent = (
          <CollabInvite
            n={notification}
            time={time}
            onAvatarPress={onAvatarPress}
            onThumbPress={onThumbPress(notification.postPreview.postId)}
          />
        );
        break;
    }

    return (
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel={`Notification from ${notification.actor.displayName}`}
        style={({ pressed }) => [
          styles.row,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            backgroundColor: pressed
              ? theme.colors.surface
              : unreadBg?.backgroundColor ?? theme.colors.background,
          },
        ]}
      >
        {/* Actor avatar — always navigates to user profile */}
        <Pressable
          onPress={onAvatarPress}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel={`View ${notification.actor.displayName}'s profile`}
        >
          <Avatar
            uri={notification.actor.avatarUrl ?? undefined}
            displayName={notification.actor.displayName}
            size="md"
            accessibilityLabel={`${notification.actor.displayName}'s avatar`}
          />
        </Pressable>

        {/* Right content area — fills between avatar and far-right widget */}
        <View style={[styles.content, { marginLeft: theme.spacing.md }]}>
          {rightContent}
        </View>
      </Pressable>
    );
  },
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  body: {
    flexWrap: 'wrap',
  },
  collabBlock: {
    flex: 1,
    gap: 8,
  },
  collabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collabActions: {
    flexDirection: 'row',
  },
  collabButton: {
    flex: 1,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    flexShrink: 0,
  },
});
