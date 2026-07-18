/**
 * Lumina — MessageBubble
 *
 * Renders a single chat message aligned left (other user) or right (current user).
 * Own messages use the accent gradient; theirs use the surface color.
 * Consecutive messages from the same sender receive tighter top spacing.
 * Timestamp and status indicator shown for own messages.
 *
 * Memoized — re-renders only when message reference or grouping changes.
 */

import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/design-system/primitives/Text';
import { useTheme } from '@/design-system/theme';
import { formatRelativeTime } from '@/utils/format';
import type { Message, MessageStatus, PostId } from '@/types/models';
import { readSharedPost } from '../utils/sharedPost';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  /**
   * True when the previous message in the list (above, i.e. older in an
   * inverted list) is from the same sender. Tightens the top margin.
   */
  isGrouped: boolean;
  /** Called with the shared post's id when a shared-post preview card is tapped. */
  onPressSharedPost?: (postId: PostId) => void;
}

// ---------------------------------------------------------------------------
// Constants — max bubble width is ~78% of parent
// ---------------------------------------------------------------------------

const BUBBLE_MAX_WIDTH_FRACTION = 0.78;
const BUBBLE_RADIUS = 18;
const BUBBLE_RADIUS_SMALL = 5;

// ---------------------------------------------------------------------------
// Status icon helper
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: MessageStatus }): React.JSX.Element | null {
  const theme = useTheme();

  if (status === 'sending') {
    return (
      <Ionicons
        name="time-outline"
        size={11}
        color={theme.colors.textTertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  if (status === 'sent') {
    return (
      <Ionicons
        name="checkmark-outline"
        size={11}
        color={theme.colors.textTertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  if (status === 'read') {
    return (
      <Ionicons
        name="checkmark-done-outline"
        size={11}
        color={theme.colors.accent}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Shared-post preview card — replaces the plain text bubble when a message
// carries a denormalized `sharedPost` snapshot (see ../utils/sharedPost).
// ---------------------------------------------------------------------------

const SHARED_POST_THUMBNAIL_SIZE = 52;

interface SharedPostCardProps {
  thumbnailUri: string;
  authorUsername: string;
  radius: Record<string, number>;
  onPress?: () => void;
}

function SharedPostCard({
  thumbnailUri,
  authorUsername,
  radius,
  onPress,
}: SharedPostCardProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      style={[
        radius,
        styles.sharedPostCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('messaging.viewSharedPost')}
    >
      <Image
        source={{ uri: thumbnailUri }}
        style={[
          styles.sharedPostThumbnail,
          { borderRadius: theme.radii.sm, backgroundColor: theme.colors.border },
        ]}
      />
      <View
        style={[
          styles.sharedPostTextWrap,
          { paddingHorizontal: theme.spacing.sm },
        ]}
      >
        <Ionicons
          name="albums-outline"
          size={13}
          color={theme.colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text
          variant="callout"
          color="secondary"
          numberOfLines={1}
          style={styles.sharedPostLabel}
        >
          {t('messaging.sharedPostLabel', { username: authorUsername })}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
  isGrouped,
  onPressSharedPost,
}: MessageBubbleProps): React.JSX.Element {
  const theme = useTheme();

  const sharedPost = readSharedPost(message);
  const relativeTime = formatRelativeTime(message.createdAt);

  const handlePressSharedPost = useCallback(() => {
    if (sharedPost) onPressSharedPost?.(sharedPost.postId);
  }, [onPressSharedPost, sharedPost]);

  // Bubble corner radii — flatten the corner closest to the avatar side for
  // grouped messages so consecutive bubbles visually merge.
  const ownRadius = {
    borderTopLeftRadius: BUBBLE_RADIUS,
    borderTopRightRadius: isGrouped ? BUBBLE_RADIUS_SMALL : BUBBLE_RADIUS,
    borderBottomLeftRadius: BUBBLE_RADIUS,
    borderBottomRightRadius: BUBBLE_RADIUS_SMALL,
  };

  const otherRadius = {
    borderTopLeftRadius: isGrouped ? BUBBLE_RADIUS_SMALL : BUBBLE_RADIUS,
    borderTopRightRadius: BUBBLE_RADIUS,
    borderBottomLeftRadius: BUBBLE_RADIUS_SMALL,
    borderBottomRightRadius: BUBBLE_RADIUS,
  };

  const bubblePadding = {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  };

  const rowMarginTop = isGrouped ? theme.spacing.xxs : theme.spacing.sm;
  const messageText = message.text ?? '';

  return (
    <View
      style={[
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
        { marginTop: rowMarginTop },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${isOwn ? 'You' : message.sender.displayName}: ${messageText}`}
    >
      <View
        style={[
          styles.bubbleContainer,
          { maxWidth: `${BUBBLE_MAX_WIDTH_FRACTION * 100}%` as `${number}%` },
        ]}
      >
        {sharedPost ? (
          <SharedPostCard
            thumbnailUri={sharedPost.thumbnailUri}
            authorUsername={sharedPost.authorUsername}
            radius={isOwn ? ownRadius : otherRadius}
            onPress={onPressSharedPost ? handlePressSharedPost : undefined}
          />
        ) : isOwn ? (
          <LinearGradient
            colors={[...theme.colors.accentGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[ownRadius, bubblePadding, styles.bubble]}
          >
            <Text
              variant="callout"
              color="inverse"
              style={styles.messageText}
            >
              {messageText}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              otherRadius,
              bubblePadding,
              styles.bubble,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              variant="callout"
              color="primary"
              style={styles.messageText}
            >
              {messageText}
            </Text>
          </View>
        )}

        {/* Timestamp + status row — own messages only */}
        {isOwn ? (
          <View style={styles.metaRow}>
            <Text variant="overline" color="tertiary" style={styles.timestamp}>
              {relativeTime}
            </Text>
            <StatusIcon status={message.status} />
          </View>
        ) : null}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    flexDirection: 'column',
  },
  bubble: {
    // Corner radii applied inline
  },
  messageText: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  timestamp: {
    // overline variant styles come from Text
  },
  sharedPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: 6,
    gap: 8,
  },
  sharedPostThumbnail: {
    width: SHARED_POST_THUMBNAIL_SIZE,
    height: SHARED_POST_THUMBNAIL_SIZE,
  },
  sharedPostTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  sharedPostLabel: {
    flexShrink: 1,
  },
});
