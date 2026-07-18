/**
 * Lumina — Explore / Search tab
 *
 * Top ExploreSearchBar + debounced (300 ms) query.
 * Empty query        → ExploreGrid (infinite post thumbnails)
 * Query starts with # → HashtagResults (infinite 3-col grid of tagged posts)
 * Otherwise          → SearchResults (infinite user list)
 *
 * Also consumes `pendingSearchQuery` from the UI store on focus — screens
 * that surface a tappable #hashtag or @mention (PostCard, PostDetail,
 * CommentItem) queue a query there and navigate here; we pick it up once,
 * seed the search input, and clear it so it doesn't re-apply on next focus.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Skeleton } from '@/design-system/primitives/Skeleton';
import { Image } from '@/components/Image';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { tabBarHeight, grid } from '@/constants/layout';
import { ExploreSearchBar } from '@/features/explore/components/ExploreSearchBar';
import { ExploreGrid } from '@/features/explore/components/ExploreGrid';
import { SearchResults } from '@/features/explore/components/SearchResults';
import { useDebounce } from '@/features/explore/hooks/useDebounce';
import { useHashtagPosts } from '@/data/query/hooks/useHashtagPosts';
import { usePendingSearchQuery, useUiStore } from '@/stores/ui.store';
import type { Post } from '@/types/models';

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// HashtagResults — 3-col grid of posts tagged with `tag` (no leading '#')
// ---------------------------------------------------------------------------

const HASHTAG_CELL_SIZE = grid.profileCellWidth;
const HASHTAG_GAP = grid.columnGap;

interface HashtagCellProps {
  post: Post;
  onPress: (postId: string) => void;
}

const HashtagCell = React.memo(function HashtagCell({
  post,
  onPress,
}: HashtagCellProps): React.JSX.Element {
  const firstMedia = post.media[0];
  const uri =
    firstMedia?.type === 'video'
      ? (firstMedia.thumbnailUri ?? firstMedia.uri)
      : firstMedia?.uri;

  const handlePress = useCallback(() => onPress(post.id), [onPress, post.id]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View post by ${post.author.username}`}
      style={styles.hashtagCell}
    >
      <Image
        source={uri ? { uri } : undefined}
        style={styles.hashtagCellImage}
        contentFit="cover"
        recyclingKey={post.id}
        transition={100}
        accessibilityRole="image"
        accessibilityLabel="Post image"
      />
    </Pressable>
  );
});

function HashtagGridSkeleton(): React.JSX.Element {
  return (
    <View style={styles.hashtagSkeletonGrid}>
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton
          key={i}
          width={HASHTAG_CELL_SIZE}
          height={HASHTAG_CELL_SIZE}
          radius={0}
          style={{ margin: HASHTAG_GAP / 2 }}
        />
      ))}
    </View>
  );
}

interface HashtagResultsProps {
  tag: string;
}

function HashtagResults({ tag }: HashtagResultsProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHashtagPosts(tag);

  const posts = useMemo<Post[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handlePostPress = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { id: postId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>): React.JSX.Element => (
      <HashtagCell post={item} onPress={handlePostPress} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const header = (
    <Text
      variant="bodyStrong"
      color="primary"
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      {t('search.hashtagHeader', { tag })}
    </Text>
  );

  if (isLoading) {
    return (
      <View style={styles.hashtagContainer}>
        {header}
        <HashtagGridSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.hashtagContainer}>
        {header}
        <ErrorState
          message={t('search.hashtagError')}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.hashtagContainer}>
        {header}
        <EmptyState
          icon="pricetag-outline"
          title={t('search.hashtagEmptyTitle')}
          subtitle={t('search.hashtagEmptySubtitle', { tag })}
        />
      </View>
    );
  }

  return (
    <FlatList<Post>
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage && posts.length > 0}
          onRefresh={() => void refetch()}
          tintColor={theme.colors.accent}
          colors={[theme.colors.accent]}
        />
      }
      contentContainerStyle={styles.hashtagListContent}
      style={styles.hashtagList}
    />
  );
}

// ---------------------------------------------------------------------------
// SearchScreen
// ---------------------------------------------------------------------------

export default function SearchScreen(): React.JSX.Element {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const pendingSearchQuery = usePendingSearchQuery();
  const clearPendingSearchQuery = useUiStore((s) => s.clearPendingSearchQuery);

  // Pick up a query queued by another screen (hashtag/mention tap) on focus,
  // then clear it so it doesn't reapply the next time this screen focuses.
  useFocusEffect(
    useCallback(() => {
      if (pendingSearchQuery !== null) {
        setQuery(pendingSearchQuery);
        clearPendingSearchQuery();
      }
    }, [pendingSearchQuery, clearPendingSearchQuery]),
  );

  const trimmedQuery = debouncedQuery.trim();
  const isHashtagSearch = trimmedQuery.startsWith('#') && trimmedQuery.length > 1;
  const isSearching = trimmedQuery.length > 0;

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Search bar */}
      <ExploreSearchBar
        value={query}
        onChangeText={setQuery}
        isSearching={isSearching}
        onClear={handleClear}
      />

      {/* Content area */}
      <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
        {isHashtagSearch ? (
          <HashtagResults tag={trimmedQuery.slice(1)} />
        ) : isSearching ? (
          <SearchResults query={debouncedQuery} />
        ) : (
          <ExploreGrid />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  hashtagContainer: {
    flex: 1,
  },
  hashtagSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HASHTAG_GAP,
    padding: HASHTAG_GAP / 2,
  },
  hashtagList: {
    flex: 1,
  },
  hashtagListContent: {
    paddingBottom: 16,
  },
  hashtagCell: {
    width: HASHTAG_CELL_SIZE,
    height: HASHTAG_CELL_SIZE,
    overflow: 'hidden',
  },
  hashtagCellImage: {
    width: HASHTAG_CELL_SIZE,
    height: HASHTAG_CELL_SIZE,
  },
});
