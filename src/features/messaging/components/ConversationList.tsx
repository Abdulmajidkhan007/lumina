/**
 * Lumina — ConversationList
 *
 * FlatList of ConversationRow items with search filtering, loading skeletons,
 * empty state, and error state. Stable callbacks and keyExtractor prevent
 * unnecessary re-renders.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { SkeletonChatRow, Divider } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import type { Conversation } from '@/types/models';

import { ConversationRow } from './ConversationRow';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationListProps {
  conversations: Conversation[] | undefined;
  currentUserId: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectConversation: (conversationId: string) => void;
}

// ---------------------------------------------------------------------------
// Skeleton list
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 6;

function SkeletonList(): React.JSX.Element {
  return (
    <View accessibilityLabel="Loading conversations" accessibilityRole="progressbar">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
         
        <SkeletonChatRow key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

function SearchBar({ value, onChangeText }: SearchBarProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.searchBar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
          marginTop: theme.spacing.xs,
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={16}
        color={theme.colors.textTertiary}
        style={{ marginLeft: theme.spacing.md }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search conversations"
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.searchInput,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.callout.fontSize,
            lineHeight: theme.typography.callout.lineHeight,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
          },
        ]}
        accessibilityLabel="Search conversations"
        accessibilityRole="search"
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const keyExtractor = (item: Conversation): string => item.id;

const ItemSeparator = (): React.JSX.Element => <Divider />;

export function ConversationList({
  conversations,
  currentUserId,
  isLoading,
  isError,
  onRetry,
  onSelectConversation,
}: ConversationListProps): React.JSX.Element {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo<Conversation[]>(() => {
    if (conversations === undefined) return [];
    if (searchQuery.trim() === '') return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.participants.some(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q),
      ),
    );
  }, [conversations, searchQuery]);

  const renderItem = useCallback<ListRenderItem<Conversation>>(
    ({ item }) => (
      <ConversationRow
        conversation={item}
        currentUserId={currentUserId}
        onPress={onSelectConversation}
      />
    ),
    [currentUserId, onSelectConversation],
  );

  const ListHeader = useMemo(
    () => (
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
    ),
    [searchQuery],
  );

  if (isError) {
    return (
      <ErrorState
        message="Couldn't load your conversations."
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.fill}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <SkeletonList />
      </View>
    );
  }

  const hasResults = filteredConversations.length > 0;

  return (
    <FlatList
      data={filteredConversations}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={
        searchQuery.trim() !== '' ? (
          <View style={styles.emptySearch}>
            <Text variant="callout" color="secondary" align="center">
              No conversations match &ldquo;{searchQuery}&rdquo;
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            subtitle="Start a conversation with someone you follow."
          />
        )
      }
      contentContainerStyle={[
        !hasResults && searchQuery.trim() === '' ? styles.emptyContainer : undefined,
        { backgroundColor: theme.colors.background },
      ]}
      style={{ backgroundColor: theme.colors.background }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptySearch: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});
