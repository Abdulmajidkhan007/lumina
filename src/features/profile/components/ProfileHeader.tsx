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

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
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
  const { mutate: followUser, isPending } = useFollowUser();

  const handleFollow = useCallback(() => {
    followUser({ userId: user.id, follow: !user.isFollowedByMe });
  }, [followUser, user.id, user.isFollowedByMe]);

  return (
    <View
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
        <Avatar
          uri={user.avatarUrl ?? undefined}
          displayName={user.displayName}
          size="2xl"
          accessibilityLabel={`${user.displayName}'s avatar`}
        />

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
              onPress={onShareProfile}
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
    </View>
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
