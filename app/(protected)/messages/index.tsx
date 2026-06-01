/**
 * Lumina — Direct Messages list screen
 *
 * Shows all conversations for the current user.
 * Header: back button + username/title + new-message icon (placeholder).
 * Body: ConversationList (search, skeletons, empty, error states).
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import { useConversations } from '@/data/query/hooks/useConversations';
import { useCurrentUser } from '@/stores/auth.store';
import { ConversationList } from '@/features/messaging/components/ConversationList';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MessagesScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const { data: conversations, isLoading, isError, refetch } = useConversations();

  const goBack = useCallback(() => router.back(), [router]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      router.push(`/(protected)/messages/${conversationId}`);
    },
    [router],
  );

  const handleNewMessage = useCallback(() => {
    // Placeholder — new-message flow wired in a future task
  }, []);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Guard: if auth is not yet hydrated, currentUser can be null.
  // ConversationList needs a currentUserId to determine "other" participant.
  const currentUserId = currentUser?.id ?? '';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        {/* Back button */}
        <Pressable
          onPress={goBack}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>

        {/* Title — shows current user's username */}
        <Text variant="bodyStrong" color="primary" numberOfLines={1}>
          {currentUser?.username ?? 'Messages'}
        </Text>

        {/* New message icon (placeholder) */}
        <Pressable
          onPress={handleNewMessage}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="New message"
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Body */}
      <ConversationList
        conversations={conversations}
        currentUserId={currentUserId}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
        onSelectConversation={handleSelectConversation}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
