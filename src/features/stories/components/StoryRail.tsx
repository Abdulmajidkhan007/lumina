/**
 * Lumina — StoryRail
 *
 * Horizontally scrolling strip of story rings. "Your story" is always first,
 * followed by story reels from the useStoryReels query.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import { SkeletonCircle } from '@/design-system/primitives/Skeleton';
import { useStoryReels } from '@/data/query/hooks/useStoryReels';
import { useCurrentUser } from '@/stores/auth.store';
import type { StoryReel } from '@/types/models';
import type { UserSummary } from '@/types/models';
import { StoryRing } from './StoryRing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union item in the rail — either the current user stub or a real StoryReel */
type RailItem =
  | { type: 'currentUser'; user: UserSummary; userId: string }
  | { type: 'reel'; reel: StoryReel };

// ---------------------------------------------------------------------------
// Skeleton strip
// ---------------------------------------------------------------------------

function StoryRailSkeleton(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[styles.skeletonRow, { paddingHorizontal: theme.spacing.lg }]}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCircle key={i} size={70} style={{ marginRight: theme.spacing.md }} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// StoryRail
// ---------------------------------------------------------------------------

export function StoryRail(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { data: reels, isLoading } = useStoryReels();

  const handleRingPress = useCallback(
    (userId: string) => {
      router.push(`/(protected)/story/${userId}`);
    },
    [router],
  );

  const items = React.useMemo<RailItem[]>(() => {
    const result: RailItem[] = [];

    if (currentUser != null) {
      result.push({
        type: 'currentUser',
        user: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
        userId: currentUser.id,
      });
    }

    if (reels != null) {
      for (const reel of reels) {
        result.push({ type: 'reel', reel });
      }
    }

    return result;
  }, [currentUser, reels]);

  const keyExtractor = useCallback((item: RailItem) => {
    if (item.type === 'currentUser') return `current-${item.userId}`;
    return `reel-${item.reel.author.id}`;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<RailItem>) => {
      const isFirst = index === 0;
      const isLast = index === items.length - 1;

      if (item.type === 'currentUser') {
        return (
          <StoryRing
            user={item.user}
            hasUnseen={false}
            isCurrentUser
            onPress={handleRingPress}
            style={{
              marginLeft: isFirst ? theme.spacing.lg : 0,
              marginRight: isLast ? theme.spacing.lg : theme.spacing.md,
            }}
          />
        );
      }

      return (
        <StoryRing
          user={item.reel.author}
          hasUnseen={item.reel.hasUnseen}
          onPress={handleRingPress}
          style={{
            marginLeft: isFirst ? theme.spacing.lg : 0,
            marginRight: isLast ? theme.spacing.lg : theme.spacing.md,
          }}
        />
      );
    },
    [handleRingPress, items.length, theme.spacing.lg, theme.spacing.md],
  );

  if (isLoading && items.length === 0) {
    return <StoryRailSkeleton />;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      style={[styles.list, { backgroundColor: theme.colors.surface }]}
      bounces={false}
      accessibilityRole="list"
      accessibilityLabel="Stories"
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
});
