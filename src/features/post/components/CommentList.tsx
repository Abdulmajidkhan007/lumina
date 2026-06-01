/**
 * Lumina — CommentList
 *
 * Infinite-scroll FlatList of CommentItem rows.
 * Delegates pagination via onEndReached -> fetchNextPage.
 * Provides ListEmptyComponent (EmptyState) and ListFooterComponent (Spinner).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  View,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { CommentItem } from './CommentItem';
import type { Comment, PostId } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommentListProps {
  postId: PostId;
  comments: Comment[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onReply: (comment: Comment) => void;
  onAuthorPress: (userId: string) => void;
  /** Extra bottom padding to account for CommentComposer height */
  composerHeight?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const END_REACHED_THRESHOLD = 0.3;

// ---------------------------------------------------------------------------
// Footer component — spinner or spacer
// ---------------------------------------------------------------------------

function ListFooter({
  isFetchingNextPage,
  composerHeight,
}: {
  isFetchingNextPage: boolean;
  composerHeight: number;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.lg,
        paddingBottom: composerHeight + theme.spacing.lg,
        alignItems: 'center',
      }}
    >
      {isFetchingNextPage ? <Spinner size="sm" /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty component
// ---------------------------------------------------------------------------

function ListEmpty(): React.JSX.Element {
  return (
    <EmptyState
      icon="chatbubble-outline"
      title="No comments yet"
      subtitle="Start the conversation."
    />
  );
}

// ---------------------------------------------------------------------------
// Comment list
// ---------------------------------------------------------------------------

export const CommentList = React.memo(function CommentList({
  comments,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onReply,
  onAuthorPress,
  composerHeight = 72,
}: CommentListProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(comments.filter((c) => c.isLikedByMe).map((c) => c.id)),
  );
  const listRef = useRef<FlatList<Comment>>(null);

  // Optimistic local like toggle (comment like mutation not in spec hooks, so local)
  const handleLike = useCallback((comment: Comment) => {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(comment.id)) {
        next.delete(comment.id);
      } else {
        next.add(comment.id);
      }
      return next;
    });
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: Comment) => item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Comment>) => {
      // Merge local like state so we don't lose optimistic updates on re-render
      const merged: Comment = likedCommentIds.has(item.id)
        ? { ...item, isLikedByMe: true }
        : item;
      return (
        <CommentItem
          comment={merged}
          onLike={handleLike}
          onReply={onReply}
          onAuthorPress={onAuthorPress}
        />
      );
    },
    [likedCommentIds, handleLike, onReply, onAuthorPress],
  );

  const listFooter = useMemo(
    () => (
      <ListFooter
        isFetchingNextPage={isFetchingNextPage}
        composerHeight={composerHeight}
      />
    ),
    [isFetchingNextPage, composerHeight],
  );

  const handleScroll = useCallback(
    (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // no-op; kept here as stable reference if scroll tracking needed
    },
    [],
  );

  return (
    <FlatList
      ref={listRef}
      data={comments}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={handleEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={listFooter}
      contentContainerStyle={{
        paddingTop: theme.spacing.sm,
        paddingBottom: insets.bottom,
        flexGrow: 1,
      }}
      removeClippedSubviews
      onScroll={handleScroll}
      scrollEventThrottle={32}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    />
  );
});
