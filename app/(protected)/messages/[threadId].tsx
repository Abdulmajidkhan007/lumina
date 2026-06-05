/**
 * Lumina — Message thread screen
 *
 * Full-screen chat for a single conversation.
 * Header: back button + other participant's Avatar + name (taps to profile).
 * Body: inverted MessageThread (infinite scroll for older messages).
 * Footer: MessageComposer pinned to bottom (handles safe area + keyboard).
 *
 * threadId is a ConversationId. The screen guards against invalid/missing params.
 */

import React, { useCallback, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { hitSlop } from '@/constants/layout';
import { useConversations } from '@/data/query/hooks/useConversations';
import { useCurrentUser } from '@/stores/auth.store';
import { conversationIdSchema } from '@/schemas';
import type { UserSummary } from '@/types/models';

import { MessageThread } from '@/features/messaging/components/MessageThread';
import { MessageComposer } from '@/features/messaging/components/MessageComposer';

// ---------------------------------------------------------------------------
// Param type
// ---------------------------------------------------------------------------

type ThreadParams = {
  threadId: string;
};

// ---------------------------------------------------------------------------
// Helper — find the other participant in a conversation
// ---------------------------------------------------------------------------

function getOtherParticipant(
  participants: UserSummary[],
  currentUserId: string,
): UserSummary | undefined {
  return participants.find((p) => p.id !== currentUserId) ?? participants[0];
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MessageThreadScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const { threadId } = useLocalSearchParams<ThreadParams>();

  // Validate the threadId param using the branded schema.
  // If it's invalid, we render a guarded empty state.
  const conversationId = useMemo(() => {
    if (!threadId) return null;
    try {
      return conversationIdSchema.parse(threadId);
    } catch {
      return null;
    }
  }, [threadId]);

  // Pull the conversation from the cache to resolve participant info.
  // useConversations is already fetched on the DM list screen; this reads
  // from the TanStack Query cache without triggering a new network request.
  const { data: conversations } = useConversations();

  const conversation = useMemo(
    () => conversations?.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  const currentUserId = currentUser?.id ?? '';

  const otherParticipant = useMemo<UserSummary | undefined>(() => {
    if (!conversation) return undefined;
    return getOtherParticipant(conversation.participants, currentUserId);
  }, [conversation, currentUserId]);

  // Build a UserSummary for the current user (needed by MessageComposer).
  const currentUserSummary = useMemo<UserSummary | null>(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    };
  }, [currentUser]);

  const goBack = useCallback(() => router.back(), [router]);

  const goToProfile = useCallback(() => {
    if (!otherParticipant) return;
    router.push(`/(protected)/user/${otherParticipant.id}`);
  }, [router, otherParticipant]);

  // Guard: invalid / missing threadId
  if (!conversationId) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Conversation not found"
          subtitle="This thread link is invalid or no longer available."
          action={{ label: 'Go back', onPress: goBack }}
        />
      </SafeAreaView>
    );
  }

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

        {/* Participant info — tapping navigates to their profile */}
        <Pressable
          onPress={goToProfile}
          style={styles.participantRow}
          disabled={!otherParticipant}
          accessibilityRole="button"
          accessibilityLabel={
            otherParticipant
              ? `View ${otherParticipant.displayName}'s profile`
              : 'Participant'
          }
        >
          <Avatar
            uri={otherParticipant?.avatarUrl ?? undefined}
            displayName={otherParticipant?.displayName}
            size="sm"
            accessibilityLabel={
              otherParticipant
                ? `${otherParticipant.displayName}'s avatar`
                : 'Participant avatar'
            }
          />
          <Text
            variant="bodyStrong"
            color="primary"
            numberOfLines={1}
            style={styles.participantName}
          >
            {otherParticipant?.displayName ?? 'Conversation'}
          </Text>
        </Pressable>

        {/* Spacer — mirror back button width for centered title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* KeyboardAvoidingView wraps body + composer so the list scrolls up */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        <View style={styles.flex}>
          <MessageThread
            conversationId={conversationId}
            currentUserId={currentUserId}
          />
        </View>

        {/* Composer — pinned to bottom */}
        {currentUserSummary !== null ? (
          <MessageComposer
            conversationId={conversationId}
            currentUserSummary={currentUserSummary}
          />
        ) : null}
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  participantRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  participantName: {
    flexShrink: 1,
  },
  headerSpacer: {
    width: 24,
  },
});
