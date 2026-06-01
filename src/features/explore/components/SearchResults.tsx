/**
 * Lumina — SearchResults
 *
 * Infinite FlatList of UserSearchResult rows shown when the search query
 * is non-empty. Handles loading skeleton, empty state, and error state.
 * Paginates via useSearchUsers.fetchNextPage on onEndReached.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { useTheme } from '@/design-system/theme';
import { Skeleton , SkeletonCircle } from '@/design-system/primitives/Skeleton';
import { Divider } from '@/design-system/primitives/Divider';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useSearchUsers } from '@/data/query/hooks/useSearchUsers';
import type { UserSummary } from '@/types/models';

import { UserSearchResult } from './UserSearchResult';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResultsProps {
  query: string;
}

// ---------------------------------------------------------------------------
// Skeleton row while loading
// ---------------------------------------------------------------------------

function SkeletonUserRow(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.skeletonRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <SkeletonCircle size={44} />
      <View style={[styles.skeletonInfo, { marginLeft: theme.spacing.md }]}>
        <Skeleton width="45%" height={14} radius="sm" />
        <Skeleton
          width="30%"
          height={12}
          radius="sm"
          style={{ marginTop: theme.spacing.xs }}
        />
      </View>
      <Skeleton width={64} height={32} radius="2xl" />
    </View>
  );
}

function SearchSkeleton(): React.JSX.Element {
  return (
    <View>
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonUserRow key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SearchResults
// ---------------------------------------------------------------------------

export function SearchResults({ query }: SearchResultsProps): React.JSX.Element {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchUsers(query);

  const users: UserSummary[] = data?.pages.flatMap((p) => p.items) ?? [];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<UserSummary>) => (
      <UserSearchResult user={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: UserSummary) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ItemSeparator = useCallback(
    () => <Divider />,
    [],
  );

  if (isLoading) {
    return <SearchSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Couldn't search users."
        onRetry={() => void refetch()}
      />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon="person-outline"
        title="No results"
        subtitle={`No users found for "${query}".`}
      />
    );
  }

  return (
    <FlatList<UserSummary>
      data={users}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      removeClippedSubviews
      windowSize={5}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonInfo: {
    flex: 1,
    gap: 4,
  },
});
