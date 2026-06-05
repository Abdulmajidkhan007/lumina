/**
 * Lumina — ReelsPager
 *
 * Fullscreen vertical FlatList pager for reels. One ReelItem per page.
 * Uses viewabilityConfig + onViewableItemsChanged to track the active index
 * so only the visible item shows interactive UI.
 *
 * Infinite scroll via useReels.fetchNextPage triggered in onEndReached.
 * getItemLayout enables instant scroll without measurement.
 * removeClippedSubviews keeps memory pressure low.
 */

import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';

import { Skeleton } from '@/design-system/primitives/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useReels } from '@/data/query/hooks/useReels';
import { screen } from '@/constants/layout';
import type { Reel } from '@/types/models';

import { ReelItem } from './ReelItem';

// ---------------------------------------------------------------------------
// Skeleton — fullscreen dark placeholder while loading
// ---------------------------------------------------------------------------

function ReelSkeleton(): React.JSX.Element {
  return (
    <View style={{ width: screen.width, height: screen.height }}>
      <Skeleton
        width={screen.width}
        height={screen.height}
        radius={0}
        style={{ backgroundColor: '#111111' }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// viewabilityConfig — item is "active" when >= 90% visible
// ---------------------------------------------------------------------------

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 90,
} as const;

// ---------------------------------------------------------------------------
// ReelsPager
// ---------------------------------------------------------------------------

export function ReelsPager(): React.JSX.Element {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReels();

  const [activeIndex, setActiveIndex] = useState(0);

  const reels: Reel[] = data?.pages.flatMap((p) => p.items) ?? [];

  // ---------------------------------------------------------------------------
  // viewability tracking — stable ref to avoid FlatList warning
  // ---------------------------------------------------------------------------

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first !== undefined && first.index !== null && first.index !== undefined) {
        setActiveIndex(first.index);
      }
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged },
  ]).current;

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---------------------------------------------------------------------------
  // Render item — memoized via React.memo on ReelItem
  // ---------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Reel>) => (
      <ReelItem reel={item} isActive={index === activeIndex} />
    ),
    [activeIndex],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Reel> | null | undefined, index: number) => ({
      length: screen.height,
      offset: screen.height * index,
      index,
    }),
    [],
  );

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.fill}>
        <ReelSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.fill}>
        <ErrorState
          message="Couldn't load reels."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.fill}>
        <EmptyState
          icon="play-circle-outline"
          title="No reels yet"
          subtitle="Short videos from people you follow will appear here."
        />
      </View>
    );
  }

  return (
    <FlatList<Reel>
      data={reels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      pagingEnabled
      snapToInterval={screen.height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      horizontal={false}
      getItemLayout={getItemLayout}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      removeClippedSubviews
      bounces={false}
      overScrollMode="never"
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={1}
      style={styles.fill}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
