/**
 * Lumina — ProfileStats
 *
 * Three-column stat row: Posts / Followers / Following.
 * Each stat is pressable (followers/following navigate to lists).
 * Displays formatted counts via formatCount.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import { formatCount } from '@/utils/format';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileStatsProps {
  postCount: number;
  followerCount: number;
  followingCount: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// ---------------------------------------------------------------------------
// StatItem — single column
// ---------------------------------------------------------------------------

interface StatItemProps {
  count: number;
  label: string;
  onPress?: () => void;
}

const StatItem = React.memo(function StatItem({
  count,
  label,
  onPress,
}: StatItemProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      hitSlop={hitSlop.sm}
      style={styles.statItem}
      accessibilityRole={onPress !== undefined ? 'button' : 'none'}
      accessibilityLabel={`${formatCount(count)} ${label}`}
    >
      <Text variant="headline" color="primary" align="center">
        {formatCount(count)}
      </Text>
      <Text
        variant="caption"
        color="secondary"
        align="center"
        style={{ marginTop: theme.spacing.xxs }}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// ProfileStats
// ---------------------------------------------------------------------------

export const ProfileStats = React.memo(function ProfileStats({
  postCount,
  followerCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
}: ProfileStatsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <StatItem count={postCount} label="Posts" />
      <Divider orientation="vertical" style={styles.divider} />
      <StatItem
        count={followerCount}
        label="Followers"
        onPress={onFollowersPress}
      />
      <Divider orientation="vertical" style={styles.divider} />
      <StatItem
        count={followingCount}
        label="Following"
        onPress={onFollowingPress}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 28,
  },
});
