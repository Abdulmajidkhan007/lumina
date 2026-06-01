/**
 * Lumina — ExploreGrid
 *
 * 3-column FlatList of explore post thumbnails. Uses expo-image for
 * fast thumbnail rendering. Tapping a cell navigates to the post detail.
 *
 * Infinite scroll via useExplore.fetchNextPage on onEndReached.
 * Skeleton grid while loading; empty + error states from design system.
 * RefreshControl for pull-to-refresh.
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import { Skeleton } from '@/design-system/primitives/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useExplore } from '@/data/query/hooks/useExplore';
import { grid } from '@/constants/layout';
import type { Post } from '@/types/models';

// ---------------------------------------------------------------------------
// Cell size — 3 columns with 1-2px gaps (use grid.columnGap)
// ---------------------------------------------------------------------------

const CELL_SIZE = grid.profileCellWidth;
const GAP = grid.columnGap;

// ---------------------------------------------------------------------------
// Skeleton grid cell
// ---------------------------------------------------------------------------

function GridSkeletonCell(): React.JSX.Element {
  return (
    <Skeleton
      width={CELL_SIZE}
      height={CELL_SIZE}
      radius={0}
      style={{ margin: GAP / 2 }}
    />
  );
}

// Skeleton grid while first load
function GridSkeleton(): React.JSX.Element {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 12 }, (_, i) => (
        <GridSkeletonCell key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// GridCell — single thumbnail tile
// ---------------------------------------------------------------------------

interface GridCellProps {
  post: Post;
  onPress: (postId: string) => void;
}

const GridCell = React.memo(function GridCell({
  post,
  onPress,
}: GridCellProps): React.JSX.Element {
  const firstMedia = post.media[0];
  const uri =
    firstMedia?.type === 'video'
      ? (firstMedia.thumbnailUri ?? firstMedia.uri)
      : firstMedia?.uri;

  const isVideo = firstMedia?.type === 'video';

  const handlePress = useCallback(() => {
    onPress(post.id);
  }, [onPress, post.id]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View post by ${post.author.username}`}
      style={styles.cell}
    >
      <Image
        source={uri ? { uri } : undefined}
        style={styles.cellImage}
        contentFit="cover"
        recyclingKey={post.id}
        transition={100}
        accessibilityRole="image"
        accessibilityLabel={isVideo ? 'Video post thumbnail' : 'Post image'}
      />
      {/* Video badge — shown for single video */}
      {isVideo && post.media.length === 1 ? (
        <View style={styles.videoBadge} pointerEvents="none">
          <View style={styles.videoBadgeInner} />
        </View>
      ) : null}
      {/* Multi-media indicator — shown for carousel posts */}
      {!isVideo && post.media.length > 1 ? (
        <View style={styles.multiMediaBadge} pointerEvents="none" />
      ) : null}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// ExploreGrid
// ---------------------------------------------------------------------------

export function ExploreGrid(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore();

  const posts = useMemo<Post[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handlePostPress = useCallback(
    (postId: string) => {
      router.push(`/(protected)/post/${postId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => (
      <GridCell post={item} onPress={handlePostPress} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <GridSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Couldn't load explore content."
        onRetry={() => void refetch()}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="images-outline"
        title="Nothing to explore"
        subtitle="Check back later for trending posts."
      />
    );
  }

  return (
    <FlatList<Post>
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      columnWrapperStyle={styles.columnWrapper}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      removeClippedSubviews
      windowSize={5}
      maxToRenderPerBatch={9}
      initialNumToRender={12}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage && posts.length > 0}
          onRefresh={() => void refetch()}
          tintColor={theme.colors.accent}
          colors={[theme.colors.accent]}
        />
      }
      contentContainerStyle={styles.listContent}
      style={styles.list}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  columnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    padding: GAP / 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    overflow: 'hidden',
  },
  cellImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgeInner: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 2,
  },
  multiMediaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
