/**
 * Lumina — FeedList
 *
 * Infinite-scroll FlatList of PostCards.
 * - StoryRail as ListHeaderComponent
 * - onEndReached -> fetchNextPage
 * - ListFooterComponent spinner
 * - RefreshControl pull-to-refresh
 * - ListEmptyComponent EmptyState / SkeletonFeedCards
 * - Error -> ErrorState with retry
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { SkeletonFeedCard } from '@/design-system/primitives/Skeleton';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Divider } from '@/design-system/primitives/Divider';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useFeed } from '@/data/query/hooks/useFeed';
import type { Post } from '@/types/models';
import { StoryRail } from '../../stories/components/StoryRail';
import { PostCard } from './PostCard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const END_REACHED_THRESHOLD = 0.3;
const SKELETON_COUNT = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyExtractor(item: Post): string {
  return item.id;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ListHeader(): React.JSX.Element {
  const theme = useTheme();
  return (
    <>
      <StoryRail />
      <Divider style={{ marginBottom: theme.spacing.xs }} />
    </>
  );
}

function ListFooter({
  isFetchingNextPage,
}: {
  isFetchingNextPage: boolean;
}): React.JSX.Element | null {
  const theme = useTheme();
  if (!isFetchingNextPage) return null;
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: theme.spacing['2xl'],
      }}
    >
      <Spinner size="md" />
    </View>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonFeedCard key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// FeedList
// ---------------------------------------------------------------------------

export function FeedList(): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useFeed();

  const posts = React.useMemo<Post[]>(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => <PostCard post={item} />,
    [],
  );

  const renderHeader = useCallback(() => <ListHeader />, []);

  const renderFooter = useCallback(
    () => <ListFooter isFetchingNextPage={isFetchingNextPage} />,
    [isFetchingNextPage],
  );

  const listContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + theme.spacing['4xl'], flexGrow: 1 as const }),
    [insets.bottom, theme.spacing],
  );

  const listStyle = useMemo(
    () => ({ backgroundColor: theme.colors.background }),
    [theme.colors.background],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return <LoadingSkeleton />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message ?? 'Could not load your feed.'}
          onRetry={handleRefresh}
        />
      );
    }
    return (
      <EmptyState
        icon="images-outline"
        title="Your feed is empty"
        subtitle="Follow people to see their posts here."
      />
    );
  }, [isLoading, isError, error, handleRefresh]);

  // Show inline error when data exists but refetch failed
  if (isError && posts.length === 0 && !isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <ListHeader />
        <ErrorState
          message={error?.message ?? 'Could not load your feed.'}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={isLoading ? [] : posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isLoading}
          onRefresh={handleRefresh}
          tintColor={theme.colors.accent}
          colors={[theme.colors.accent]}
        />
      }
      contentContainerStyle={listContentStyle}
      style={listStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      accessibilityRole="list"
      accessibilityLabel="Feed posts"
    />
  );
}
