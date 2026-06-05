/**
 * Lumina — ReelOverlay
 *
 * Bottom-left overlay on a fullscreen reel showing:
 * - Author username (pressable → profile)
 * - Follow button (if not already following)
 * - Caption (truncated, expandable)
 * - Audio title row with marquee-ish styling
 *
 * Memoized; receives only stable primitives/callbacks.
 */

import React, { useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { hitSlop } from '@/constants/layout';
import { useTheme } from '@/design-system/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReelOverlayProps {
  username: string;
  isFollowedByMe: boolean;
  isMe: boolean;
  caption: string | null;
  audioTitle: string | undefined;
  onUsernamePress: () => void;
  onFollow: () => void;
  followLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Caption — truncated with "more" expand
// ---------------------------------------------------------------------------

const MAX_LINES = 2;

const Caption = React.memo(function Caption({
  text,
}: {
  text: string;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const expand = useCallback(() => setExpanded(true), []);

  return (
    <View>
      <Text
        variant="callout"
        numberOfLines={expanded ? undefined : MAX_LINES}
        style={styles.captionText}
      >
        {text}
      </Text>
      {!expanded ? (
        <Pressable onPress={expand} hitSlop={hitSlop.sm}>
          <Text variant="caption" style={styles.moreText}>
            more
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// ReelOverlay
// ---------------------------------------------------------------------------

export const ReelOverlay = React.memo(function ReelOverlay({
  username,
  isFollowedByMe,
  isMe,
  caption,
  audioTitle,
  onUsernamePress,
  onFollow,
  followLoading = false,
}: ReelOverlayProps): React.JSX.Element {
  const theme = useTheme();
  const showFollowBtn = !isMe && !isFollowedByMe;

  return (
    <View style={styles.container}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <Pressable
          onPress={onUsernamePress}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel={`View ${username}'s profile`}
        >
          <Text variant="bodyStrong" style={styles.username}>
            @{username}
          </Text>
        </Pressable>

        {showFollowBtn ? (
          <Button
            label={isFollowedByMe ? 'Following' : 'Follow'}
            variant="secondary"
            size="sm"
            loading={followLoading}
            onPress={onFollow}
            accessibilityLabel={`Follow ${username}`}
            style={[styles.followBtn, { borderColor: theme.colors.overlay }]}
          />
        ) : null}
      </View>

      {/* Caption */}
      {caption !== null && caption.trim() !== '' ? (
        <View style={styles.captionWrapper}>
          <Caption text={caption} />
        </View>
      ) : null}

      {/* Audio row */}
      {audioTitle !== undefined && audioTitle.trim() !== '' ? (
        <View style={styles.audioRow}>
          <Ionicons
            name="musical-notes-outline"
            size={14}
            color="#FFFFFF"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            variant="caption"
            numberOfLines={1}
            style={styles.audioTitle}
            accessibilityLabel={`Audio: ${audioTitle}`}
          >
            {audioTitle}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 6,
    maxWidth: '75%',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  username: {
    color: '#FFFFFF',
  },
  followBtn: {
    // compact inline button — borderColor applied via theme inline
  },
  captionWrapper: {
    // slight indent under username
  },
  captionText: {
    color: '#FFFFFF',
  },
  moreText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  audioTitle: {
    color: '#FFFFFF',
    flex: 1,
  },
});
