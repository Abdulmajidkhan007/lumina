/**
 * Lumina — StoryRing
 *
 * A single tappable story avatar ring in the horizontal story rail.
 * Unseen stories show the accent gradient ring; seen stories show a muted border.
 * The first item is "Your story" with a + badge.
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Image } from '@/components/Image';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import type { UserSummary } from '@/types/models';
import { storyRing } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoryRingProps {
  user: UserSummary;
  hasUnseen: boolean;
  /** True for the "Your story" cell — shows a + add badge */
  isCurrentUser?: boolean;
  onPress: (userId: string) => void;
  /**
   * Renders the + badge as its own tap target that always opens the story
   * composer, independent of what tapping the ring itself does. Only
   * meaningful when `isCurrentUser` is true.
   */
  onAddPress?: () => void;
  /** Shows a spinner overlay on the ring while a new story is uploading */
  isUploading?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_SIZE = storyRing.avatarSize;
const RING_BORDER = storyRing.borderWidth;
const RING_GAP = storyRing.gap;
const TOTAL_SIZE = storyRing.totalSize;
const LABEL_MAX_WIDTH = TOTAL_SIZE + 8;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StoryRing = React.memo(function StoryRing({
  user,
  hasUnseen,
  isCurrentUser = false,
  onPress,
  onAddPress,
  isUploading = false,
  style,
}: StoryRingProps): React.JSX.Element {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    onPress(user.id);
  }, [onPress, user.id]);

  const handleAddPress = useCallback(() => {
    onAddPress?.();
  }, [onAddPress]);

  const innerSize = AVATAR_SIZE;
  const showGradientRing = hasUnseen && !isCurrentUser;

  const avatarImage = (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: theme.colors.surface,
          borderWidth: showGradientRing || isCurrentUser ? RING_GAP : 0,
          borderColor: theme.colors.background,
        },
      ]}
    >
      {user.avatarUrl != null ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: innerSize / 2 }]}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${user.displayName}'s avatar`}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.fallback,
            {
              borderRadius: innerSize / 2,
              backgroundColor: theme.colors.surfaceElevated,
            },
          ]}
        >
          <Text variant="callout" color="secondary">
            {user.displayName[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      {isUploading ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.uploadingOverlay,
            { borderRadius: innerSize / 2 },
          ]}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={
        isCurrentUser
          ? isUploading
            ? 'Your story, uploading'
            : 'Your story'
          : `${user.username}'s story${hasUnseen ? ', unseen' : ''}`
      }
    >
      {/* Ring */}
      {showGradientRing ? (
        <LinearGradient
          colors={[...theme.colors.accentGradient]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.ring,
            {
              width: TOTAL_SIZE,
              height: TOTAL_SIZE,
              borderRadius: TOTAL_SIZE / 2,
              padding: RING_BORDER,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          {avatarImage}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.ring,
            {
              width: TOTAL_SIZE,
              height: TOTAL_SIZE,
              borderRadius: TOTAL_SIZE / 2,
              padding: RING_BORDER,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: isCurrentUser
                ? theme.colors.accent
                : theme.colors.border,
            },
          ]}
        >
          {avatarImage}
        </View>
      )}

      {/* Add badge for current user — its own tap target so it always opens
          the story composer, independent of what tapping the ring does. */}
      {isCurrentUser ? (
        <Pressable
          onPress={handleAddPress}
          hitSlop={hitSlop.sm}
          style={[
            styles.addBadge,
            {
              backgroundColor: theme.colors.accent,
              borderColor: theme.colors.background,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add to your story"
        >
          <Ionicons name="add" size={10} color="#FFFFFF" />
        </Pressable>
      ) : null}

      {/* Username label */}
      <Text
        variant="overline"
        color="secondary"
        align="center"
        numberOfLines={1}
        style={{ maxWidth: LABEL_MAX_WIDTH, marginTop: 4 }}
      >
        {isCurrentUser ? 'Your story' : user.username}
      </Text>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ring: {
    // layout via inline styles
  },
  avatarWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  addBadge: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
