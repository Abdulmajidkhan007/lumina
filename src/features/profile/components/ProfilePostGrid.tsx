/**
 * Lumina — ProfilePostGrid
 *
 * 3-column FlashList thumbnail grid of a user's posts.
 * Wired to useFeed (userId-scoped). Loads next page on scroll.
 * Loading skeleton, empty state, error state from design system.
 * Tapping a thumbnail pushes post/[id].
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from '@/components/Image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';

import { useTheme } from '@/design-system/theme';
import { Skeleton } from '@/design-system/primitives/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useFeed } from '@/data/query/hooks/useFeed';
import { grid } from '@/constants/layout';
import type { Post, UserId } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfilePostGridProps {
  userId: UserId;
  /** Additional header component rendered above the grid (ListHeaderComponent) */
  ListHeaderComponent?: React.ReactElement | null;
}

// ---------------------------------------------------------------------------
// Grid skeleton
// ---------------------------------------------------------------------------

function GridSkeleton(): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const skeletonItems = Array.from({ length: 9 }, (_, i) => i);

  return (
    <View style={styles.skeletonGrid}>
      {skeletonItems.map((i) => (
        <Skeleton
          key={i}
          width={CELL}
          height={CELL}
          radius={0}
          style={{ margin: grid.columnGap / 2 }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PostThumbnail — memoized grid cell
// ---------------------------------------------------------------------------

interface PostThumbnailProps {
  post: Post;
  onPress: (postId: string) => void;
}

const PostThumbnail = React.memo(function PostThumbnail({
  post,
  onPress,
}: PostThumbnailProps): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const firstMedia = post.media[0];

  const handlePress = useCallback(() => {
    onPress(post.id);
  }, [onPress, post.id]);

  return (
    <Pressable
      style={{ width: CELL, height: CELL, margin: grid.columnGap / 2 }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View post${post.caption ? ': ' + post.caption.slice(0, 40) : ''}`}
    >
      {firstMedia !== undefined ? (
        <Image
          source={{ uri: firstMedia.uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.noMediaPlaceholder]} />
      )}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// ProfilePostGrid
// ---------------------------------------------------------------------------

export function ProfilePostGrid({
  userId,
  ListHeaderComponent,
}: ProfilePostGridProps): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(userId);

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handlePostPress = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { id: postId });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostThumbnail post={item} onPress={handlePostPress} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const listContentStyle = useMemo(() => ({ paddingBottom: 80 }), []);

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon="image-outline"
        title="No posts yet"
        subtitle="When you share photos they'll appear here."
      />
    ),
    [],
  );

  // Show skeleton inside the list header area on first load
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {ListHeaderComponent ?? null}
        <GridSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {ListHeaderComponent ?? null}
        <ErrorState
          message="Couldn't load posts."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={grid.profileColumns}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      contentContainerStyle={listContentStyle}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noMediaPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
});
