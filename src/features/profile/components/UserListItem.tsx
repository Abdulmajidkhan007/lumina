/**
 * Lumina — UserListItem
 *
 * Row component for followers/following lists.
 * Avatar + displayName + username + follow/following button (optimistic).
 * Tapping the row pushes user/[id].
 * Memoized to minimise re-renders inside FlashList.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { Ionicons } from '@expo/vector-icons';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import type { UserSummary } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserListItemProps {
  user: UserSummary;
  /** Whether the current user follows this person */
  isFollowedByMe: boolean;
  /** Whether this item represents the current user (hide follow button) */
  isMe?: boolean;
  onPress: (userId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserListItem = React.memo(function UserListItem({
  user,
  isFollowedByMe,
  isMe = false,
  onPress,
}: UserListItemProps): React.JSX.Element {
  const theme = useTheme();
  const { mutate: followUser, isPending } = useFollowUser();

  const handlePress = useCallback(() => {
    onPress(user.id);
  }, [onPress, user.id]);

  const handleFollow = useCallback(() => {
    followUser({ userId: user.id, follow: !isFollowedByMe });
  }, [followUser, user.id, isFollowedByMe]);

  return (
    <Pressable
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View ${user.displayName}'s profile`}
    >
      <Avatar
        uri={user.avatarUrl ?? undefined}
        displayName={user.displayName}
        size="md"
        accessibilityLabel={`${user.displayName}'s avatar`}
      />

      <View style={[styles.info, { marginLeft: theme.spacing.md }]}>
        <View style={styles.nameRow}>
          <Text variant="bodyStrong" color="primary" numberOfLines={1}>
            {user.displayName}
          </Text>
          {user.isVerified ? (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={theme.colors.accent}
              style={{ marginLeft: 4 }}
              accessibilityLabel="Verified"
            />
          ) : null}
        </View>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          @{user.username}
        </Text>
      </View>

      {!isMe ? (
        <Button
          label={isFollowedByMe ? 'Following' : 'Follow'}
          variant={isFollowedByMe ? 'secondary' : 'primary'}
          size="sm"
          loading={isPending}
          onPress={handleFollow}
          accessibilityLabel={
            isFollowedByMe
              ? `Unfollow ${user.username}`
              : `Follow ${user.username}`
          }
        />
      ) : null}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
