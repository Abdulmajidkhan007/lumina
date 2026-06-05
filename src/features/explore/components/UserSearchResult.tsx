/**
 * Lumina — UserSearchResult
 *
 * Single row in the user search results list.
 * Shows Avatar + username + displayName + optimistic Follow button.
 * Tapping the row navigates to the user's profile.
 *
 * Memoized; stable callbacks only.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import { useCurrentUser } from '@/stores/auth.store';
import { hitSlop } from '@/constants/layout';
import type { UserSummary } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSearchResultProps {
  user: UserSummary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserSearchResult = React.memo(function UserSearchResult({
  user,
}: UserSearchResultProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { mutate: followUser, isPending } = useFollowUser();

  // Local optimistic "is following" state — starts false because UserSummary
  // doesn't expose isFollowedByMe. The full state comes from useUser cache.
  const [localFollowing, setLocalFollowing] = useState(false);

  const isMe = currentUser?.id === user.id;

  const handleRowPress = useCallback(() => {
    router.push(`/(protected)/user/${user.id}`);
  }, [router, user.id]);

  const handleFollowPress = useCallback(() => {
    const nextFollowing = !localFollowing;
    setLocalFollowing(nextFollowing);
    followUser({ userId: user.id, follow: nextFollowing });
  }, [followUser, user.id, localFollowing]);

  return (
    <Pressable
      onPress={handleRowPress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={`View ${user.username}'s profile`}
      style={[
        styles.row,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      {/* Avatar */}
      <Avatar
        uri={user.avatarUrl ?? undefined}
        displayName={user.displayName}
        size="md"
        accessibilityLabel={`${user.displayName}'s avatar`}
      />

      {/* Name info */}
      <View style={[styles.info, { marginLeft: theme.spacing.md }]}>
        <View style={styles.usernameRow}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {user.username}
          </Text>
          {user.isVerified ? (
            <Text variant="bodyStrong" color="accent" style={{ marginLeft: 4 }}>
              ✓
            </Text>
          ) : null}
        </View>
        <Text
          variant="caption"
          color="secondary"
          numberOfLines={1}
        >
          {user.displayName}
        </Text>
      </View>

      {/* Follow button — hidden for self */}
      {!isMe ? (
        <Button
          label={localFollowing ? 'Following' : 'Follow'}
          variant={localFollowing ? 'secondary' : 'primary'}
          size="sm"
          loading={isPending}
          onPress={handleFollowPress}
          accessibilityLabel={`${localFollowing ? 'Unfollow' : 'Follow'} ${user.username}`}
        />
      ) : null}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
