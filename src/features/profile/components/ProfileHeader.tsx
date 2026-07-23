/**
 * Lumina — ProfileHeader
 *
 * Shows avatar, displayName, username, bio, verified badge, and the
 * stats row. Action buttons differ by isMe:
 *   - isMe:    "Edit Profile" + "Share Profile" (+ gear in parent nav header)
 *   - other:   Follow/Following (optimistic) + Message
 *
 * Used by both profile.tsx (own) and user/[id].tsx (other).
 */

import React, { useCallback, useEffect } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import {
  useCancelFollowRequest,
  useFollowRequestStatus,
} from '@/data/query/hooks/useFollowRequests';
import type { User } from '@/types/models';
import { ProfileStats } from './ProfileStats';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileHeaderProps {
  user: User;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onMessage?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

/** Strips the scheme and any trailing slash so the link reads like Instagram's. */
function formatWebsite(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProfileHeader = React.memo(function ProfileHeader({
  user,
  onEditProfile,
  onShareProfile,
  onMessage,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { mutate: followUser, isPending: isFollowPending } = useFollowUser();
  const { mutate: cancelFollowRequest, isPending: isCancelPending } = useCancelFollowRequest();
  const { data: followStatus } = useFollowRequestStatus(user.isMe ? null : user.id);

  // useFollowRequestStatus is the source of truth for the button — it
  // distinguishes an established follow from a pending request, which
  // `user.isFollowedByMe` alone cannot. Fall back to that flag only while
  // the status query hasn't resolved yet (first paint / cache miss).
  const followState: 'following' | 'requested' | 'none' =
    followStatus ?? (user.isFollowedByMe ? 'following' : 'none');

  const avatarScale = useSharedValue(0.9);
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  useEffect(() => {
    avatarScale.value = reducedMotion
      ? 1
      : withSpring(1, { damping: 14, stiffness: 200 });
  }, [avatarScale, reducedMotion]);

  const handleFollow = useCallback(() => {
    if (followState === 'requested') {
      cancelFollowRequest(user.id);
      return;
    }
    followUser({
      userId: user.id,
      follow: followState !== 'following',
      targetIsPrivate: user.isPrivate,
    });
  }, [followState, followUser, cancelFollowRequest, user.id, user.isPrivate]);

  const handleShareProfile = useCallback(() => {
    const share = async (): Promise<void> => {
      try {
        await Share.share({
          // The dead lumina.app domain is replaced with the live web app URL
          // plus the handle, so the shared link actually resolves.
          message: `Check out @${user.username} on Lumina ✦\nhttps://lumina-007app.web.app/u/${user.username}`,
        });
      } catch {
        // Share sheet dismissed or failed — no action needed.
      }
      onShareProfile?.();
    };
    void share();
  }, [user.username, onShareProfile]);

  const handleOpenWebsite = useCallback(() => {
    if (!user.website) return;
    void Linking.openURL(user.website).catch(() => {
      // Invalid/unsupported URL — silently ignore, mirroring the share sheet.
    });
  }, [user.website]);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(300)}
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Top row: avatar + stats */}
      <View style={styles.topRow}>
        <Animated.View style={avatarAnimatedStyle}>
          <Avatar
            uri={user.avatarUrl ?? undefined}
            displayName={user.displayName}
            size="2xl"
            accessibilityLabel={`${user.displayName}'s avatar`}
          />
        </Animated.View>

        <View style={styles.statsContainer}>
          <ProfileStats
            postCount={user.postCount}
            followerCount={user.followerCount}
            followingCount={user.followingCount}
            onFollowersPress={onFollowersPress}
            onFollowingPress={onFollowingPress}
          />
        </View>
      </View>

      {/* Name + verified badge */}
      <View
        style={[styles.nameRow, { marginTop: theme.spacing.md }]}
      >
        <Text variant="bodyStrong" color="primary">
          {user.displayName}
        </Text>
        {user.isVerified ? (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={theme.colors.accent}
            style={styles.verifiedBadge}
            accessibilityLabel="Verified"
          />
        ) : null}
      </View>

      {/* Username */}
      <Text
        variant="caption"
        color="secondary"
        style={{ marginTop: theme.spacing.xxs }}
      >
        @{user.username}
      </Text>

      {/* Bio */}
      {user.bio !== null && user.bio.trim() !== '' ? (
        <Text
          variant="callout"
          color="primary"
          style={{ marginTop: theme.spacing.sm }}
        >
          {user.bio}
        </Text>
      ) : null}

      {/* Website ("link in bio") */}
      {user.website !== null && user.website.trim() !== '' ? (
        <Pressable
          onPress={handleOpenWebsite}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel={user.website}
          style={{ marginTop: theme.spacing.xxs }}
        >
          <Text variant="callout" color="accent" numberOfLines={1}>
            {formatWebsite(user.website)}
          </Text>
        </Pressable>
      ) : null}

      {/* Action buttons */}
      <View style={[styles.actionsRow, { marginTop: theme.spacing.md, gap: theme.spacing.sm }]}>
        {user.isMe ? (
          <>
            <Button
              label="Edit profile"
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              onPress={onEditProfile}
              accessibilityLabel="Edit your profile"
            />
            <Button
              label="Share profile"
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              onPress={handleShareProfile}
              accessibilityLabel="Share your profile"
            />
          </>
        ) : (
          <>
            <Button
              label={
                followState === 'following'
                  ? t('social.followButton.following')
                  : followState === 'requested'
                  ? t('social.followButton.requested')
                  : t('social.followButton.follow')
              }
              variant={followState === 'none' ? 'primary' : 'secondary'}
              size="sm"
              style={styles.actionButton}
              loading={isFollowPending || isCancelPending}
              onPress={handleFollow}
              accessibilityLabel={
                followState === 'following'
                  ? t('social.followButton.unfollowA11y', { username: user.username })
                  : followState === 'requested'
                  ? t('social.followButton.cancelRequestA11y', { username: user.username })
                  : t('social.followButton.followA11y', { username: user.username })
              }
            />
            <Button
              label="Message"
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              onPress={onMessage}
              accessibilityLabel={`Send ${user.username} a message`}
            />
          </>
        )}
      </View>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    // padding applied inline
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
});
