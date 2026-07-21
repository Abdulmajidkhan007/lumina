/**
 * Lumina — CommentList
 *
 * Infinite-scroll FlatList of CommentItem rows.
 * Delegates pagination via onEndReached -> fetchNextPage.
 * Provides ListEmptyComponent (EmptyState) and ListFooterComponent (Spinner).
 */

import React, { useCallback, useMemo, useRef } from 'react';
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
  /** Whether the viewer is the post author (may pin/unpin comments). */
  canModerate?: boolean;
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
  postId,
  comments,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onReply,
  onAuthorPress,
  canModerate = false,
  composerHeight = 72,
}: CommentListProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Comment>>(null);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: Comment) => item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Comment>) => (
      <CommentItem
        comment={item}
        postId={postId}
        onReply={onReply}
        onAuthorPress={onAuthorPress}
        canModerate={canModerate}
      />
    ),
    [postId, onReply, onAuthorPress, canModerate],
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
