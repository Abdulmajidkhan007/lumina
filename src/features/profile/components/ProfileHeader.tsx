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
import { Share, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
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
  const reducedMotion = useReducedMotion();
  const { mutate: followUser, isPending } = useFollowUser();

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
    followUser({ userId: user.id, follow: !user.isFollowedByMe });
  }, [followUser, user.id, user.isFollowedByMe]);

  const handleShareProfile = useCallback(() => {
    const share = async (): Promise<void> => {
      try {
        await Share.share({
          message: `https://lumina.app/user/${user.id}`,
        });
      } catch {
        // Share sheet dismissed or failed — no action needed.
      }
      onShareProfile?.();
    };
    void share();
  }, [user.id, onShareProfile]);

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
              label={user.isFollowedByMe ? 'Following' : 'Follow'}
              variant={user.isFollowedByMe ? 'secondary' : 'primary'}
              size="sm"
              style={styles.actionButton}
              loading={isPending}
              onPress={handleFollow}
              accessibilityLabel={
                user.isFollowedByMe
                  ? `Unfollow ${user.username}`
                  : `Follow ${user.username}`
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
