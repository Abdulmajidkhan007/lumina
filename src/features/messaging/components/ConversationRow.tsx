/**
 * Lumina — ConversationRow
 *
 * A single row in the DM list. Shows avatar, display name, last message preview,
 * relative time, and an unread badge dot. Bold styling when unread.
 * Memoized — only re-renders when the conversation reference changes.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { useTheme } from '@/design-system/theme';
import { formatRelativeTime } from '@/utils/format';
import { hitSlop } from '@/constants/layout';
import type { Conversation, UserSummary } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationRowProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: (conversationId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the participant who is not the current user. Falls back to first. */
function getOtherParticipant(
  participants: UserSummary[],
  currentUserId: string,
): UserSummary {
  return participants.find((p) => p.id !== currentUserId) ?? participants[0]!;
}

const MAX_PREVIEW_LENGTH = 60;

function truncatePreview(text: string): string {
  if (text.length <= MAX_PREVIEW_LENGTH) return text;
  return text.slice(0, MAX_PREVIEW_LENGTH).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ConversationRow = React.memo(function ConversationRow({
  conversation,
  currentUserId,
  onPress,
}: ConversationRowProps): React.JSX.Element {
  const theme = useTheme();

  const other = getOtherParticipant(conversation.participants, currentUserId);
  const hasUnread = conversation.unreadCount > 0;

  const handlePress = useCallback(() => {
    onPress(conversation.id);
  }, [onPress, conversation.id]);

  const previewText =
    conversation.lastMessage?.text !== undefined
      ? truncatePreview(conversation.lastMessage.text)
      : 'No messages yet';

  const relativeTime =
    conversation.lastMessage !== undefined
      ? formatRelativeTime(conversation.lastMessage.createdAt)
      : '';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${other.displayName}${hasUnread ? `, ${conversation.unreadCount} unread` : ''}`}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
        },
      ]}
    >
      {/* Avatar */}
      <Avatar
        uri={other.avatarUrl ?? undefined}
        displayName={other.displayName}
        size="md"
        accessibilityLabel={`${other.displayName}'s avatar`}
        style={styles.avatar}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Top row: name + timestamp */}
        <View style={styles.topRow}>
          <Text
            variant={hasUnread ? 'bodyStrong' : 'body'}
            color="primary"
            numberOfLines={1}
            style={styles.name}
          >
            {other.displayName}
          </Text>
          {relativeTime !== '' ? (
            <Text
              variant="caption"
              color={hasUnread ? 'accent' : 'tertiary'}
              style={styles.timestamp}
            >
              {relativeTime}
            </Text>
          ) : null}
        </View>

        {/* Bottom row: preview + unread dot */}
        <View style={styles.bottomRow}>
          <Text
            variant="callout"
            color={hasUnread ? 'primary' : 'secondary'}
            numberOfLines={1}
            style={[
              styles.preview,
              hasUnread ? { fontWeight: '600' } : undefined,
            ]}
          >
            {previewText}
          </Text>
          {hasUnread ? (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: theme.colors.accent },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
  },
  timestamp: {
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preview: {
    flex: 1,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 9999,
    flexShrink: 0,
  },
});
