/**
 * Lumina — NotificationList
 *
 * Infinite FlatList of notifications grouped by time bucket (Today / This Week
 * / Earlier). Uses NotificationSectionHeader as a separator between buckets.
 *
 * States handled:
 *   - loading  → skeleton rows (SkeletonChatRow reused; similar density)
 *   - empty    → EmptyState
 *   - error    → ErrorState with retry
 *   - success  → grouped FlatList with pagination
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { SkeletonChatRow, Spinner } from '@/design-system';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useTheme } from '@/design-system/theme';
import { useNotifications } from '@/data/query/hooks/useNotifications';
import type { Notification } from '@/types/models';
import { NotificationItem } from './NotificationItem';
import {
  NotificationSectionHeader,
  type TimeBucket,
} from './NotificationSectionHeader';

// ---------------------------------------------------------------------------
// Time-bucket helpers
// ---------------------------------------------------------------------------

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;

function getBucket(isoDate: string): TimeBucket {
  const age = Date.now() - new Date(isoDate).getTime();
  if (age < MS_DAY) return 'Today';
  if (age < MS_WEEK) return 'This Week';
  return 'Earlier';
}

// ---------------------------------------------------------------------------
// List item union — either a header stub or a real notification
// ---------------------------------------------------------------------------

type ListEntry =
  | { kind: 'header'; bucket: TimeBucket; key: string }
  | { kind: 'item'; notification: Notification; key: string };

function buildEntries(notifications: Notification[]): ListEntry[] {
  const entries: ListEntry[] = [];
  let lastBucket: TimeBucket | null = null;

  for (const n of notifications) {
    const bucket = getBucket(n.createdAt);
    if (bucket !== lastBucket) {
      entries.push({ kind: 'header', bucket, key: `header-${bucket}` });
      lastBucket = bucket;
    }
    entries.push({ kind: 'item', notification: n, key: n.id });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Skeleton placeholder list
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 6;

function NotificationSkeletonList(): React.JSX.Element {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonChatRow key={i} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// NotificationList
// ---------------------------------------------------------------------------

export function NotificationList(): React.JSX.Element {
  const theme = useTheme();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  // Flatten pages into a single sorted list
  const allNotifications = useMemo<Notification[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const entries = useMemo(
    () => buildEntries(allNotifications),
    [allNotifications],
  );

  const keyExtractor = useCallback((entry: ListEntry) => entry.key, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListEntry>): React.JSX.Element | null => {
      if (item.kind === 'header') {
        return <NotificationSectionHeader title={item.bucket} />;
      }
      return <NotificationItem notification={item.notification} />;
    },
    [],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const listFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <View style={[styles.footer, { paddingVertical: theme.spacing.xl }]}>
          <Spinner size="sm" />
        </View>
      ) : null,
    [isFetchingNextPage, theme.spacing.xl],
  );

  // --- Loading state ---
  if (isLoading) {
    return (
      <View style={styles.fill}>
        <NotificationSkeletonList />
      </View>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <View style={styles.fill}>
        <ErrorState
          message="Couldn't load notifications. Please try again."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  // --- Empty state ---
  if (entries.length === 0) {
    return (
      <View style={styles.fill}>
        <EmptyState
          icon="notifications-outline"
          title="No activity yet"
          subtitle="Likes, comments, follows, and mentions will appear here."
        />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={listFooter}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Notifications list"
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  footer: {
    alignItems: 'center',
  },
});
