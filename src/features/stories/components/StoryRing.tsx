/**
 * Lumina — StoryRing
 *
 * A single tappable story avatar ring in the horizontal story rail.
 * Unseen stories show the accent gradient ring; seen stories show a muted border.
 * The first item is "Your story" with a + badge.
 */

import React, { useCallback } from 'react';
import {
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
  style,
}: StoryRingProps): React.JSX.Element {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    onPress(user.id);
  }, [onPress, user.id]);

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
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={
        isCurrentUser
          ? 'Your story'
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

      {/* Add badge for current user */}
      {isCurrentUser ? (
        <View
          style={[
            styles.addBadge,
            {
              backgroundColor: theme.colors.accent,
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Ionicons name="add" size={10} color="#FFFFFF" />
        </View>
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
