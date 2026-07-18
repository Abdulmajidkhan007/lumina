/**
 * Lumina — MessageThread
 *
 * Inverted FlatList of MessageBubble items for a single conversation.
 * Newest messages appear at the bottom (inverted list — index 0 is bottom).
 * Scrolling up triggers fetchNextPage to load older messages.
 *
 * Handles: loading spinner, empty state, error state, and pagination.
 * Memoized renderItem prevents unnecessary re-renders.
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';

import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useTheme } from '@/design-system/theme';
import type { Message , ConversationId, PostId } from '@/types/models';
import { useMessages } from '@/data/query/hooks/useMessages';

import { MessageBubble } from './MessageBubble';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageThreadProps {
  conversationId: ConversationId;
  currentUserId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const keyExtractor = (item: Message): string => item.id;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageThread({
  conversationId,
  currentUserId,
}: MessageThreadProps): React.JSX.Element {
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
  } = useMessages(conversationId);

  const handlePressSharedPost = useCallback(
    (postId: PostId) => {
      navigation.navigate('PostDetail', { id: postId });
    },
    [navigation],
  );

  // Flatten all pages into a single array.
  // The API returns messages in newest-first order per page.
  // With inverted=true, the FlatList shows index-0 at the bottom,
  // so newest (index 0) appears at the bottom — correct chat behaviour.
  const messages = useMemo<Message[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const renderItem = useCallback<ListRenderItem<Message>>(
    ({ item, index }) => {
      const isOwn = item.sender.id === currentUserId;
      // In the flattened array, index 0 is newest. The next item (index+1) is
      // older — displayed above in the inverted list (visually previous message).
      // "Grouped" means the item directly above (older, index+1) has the same sender.
      const nextMessage = messages[index + 1];
      const isGrouped =
        nextMessage !== undefined && nextMessage.sender.id === item.sender.id;

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          isGrouped={isGrouped}
          onPressSharedPost={handlePressSharedPost}
        />
      );
    },
    [currentUserId, messages, handlePressSharedPost],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <View style={styles.paginationSpinner}>
          <Spinner size="sm" />
        </View>
      ) : null,
    [isFetchingNextPage],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Couldn't load messages."
        onRetry={() => void refetch()}
      />
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="No messages yet"
        subtitle="Say hello and start the conversation."
      />
    );
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      inverted
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={ListFooter}
      contentContainerStyle={[
        styles.listContent,
        { paddingVertical: theme.spacing.sm },
      ]}
      style={{ backgroundColor: theme.colors.background }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      // Prevent aggressive re-layout on keyboard open
      automaticallyAdjustKeyboardInsets={false}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  paginationSpinner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
