/**
 * Lumina — Avatar primitive
 *
 * expo-image backed avatar with optional story-ring (luminous gradient border),
 * fallback initials, and multiple sizes.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from '@/components/Image';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../theme';
import { Text } from './Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  /** Remote or local image URI */
  uri?: string;
  /** Display name — used to derive initials fallback */
  displayName?: string;
  size?: AvatarSize;
  /** Show luminous gradient ring (story border) */
  hasStoryRing?: boolean;
  /** Override container style */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Size map — token-aligned values
// ---------------------------------------------------------------------------

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
  '2xl': 96,
};

/** Ring border width scales with avatar size */
const RING_BORDER: Record<AvatarSize, number> = {
  xs: 1.5,
  sm: 2,
  md: 2.5,
  lg: 3,
  xl: 3,
  '2xl': 3.5,
};

/** Gap between ring and image */
const RING_GAP = 2;

/** Typography variant for initials fallback */
const INITIALS_VARIANT: Record<AvatarSize, 'overline' | 'caption' | 'callout' | 'body' | 'headline'> = {
  xs: 'overline',
  sm: 'caption',
  md: 'callout',
  lg: 'body',
  xl: 'headline',
  '2xl': 'headline',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveInitials(displayName?: string): string {
  if (!displayName) return '?';
  const parts = displayName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Avatar({
  uri,
  displayName,
  size = 'md',
  hasStoryRing = false,
  style,
  accessibilityLabel,
}: AvatarProps): React.JSX.Element {
  const theme = useTheme();

  const avatarSize = SIZE_PX[size];
  const borderWidth = RING_BORDER[size];
  const totalSize = hasStoryRing ? avatarSize + (borderWidth + RING_GAP) * 2 : avatarSize;
  const innerSize = hasStoryRing ? avatarSize : avatarSize;
  const initials = useMemo(() => deriveInitials(displayName), [displayName]);

  const imageEl = (
    <View
      style={[
        styles.imageWrapper,
        {
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: theme.colors.surface,
          // white gap ring between gradient border and avatar
          ...(hasStoryRing
            ? {
                borderWidth: RING_GAP,
                borderColor: theme.colors.background,
              }
            : {}),
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: innerSize / 2 }]}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel ?? displayName ?? 'Avatar'}
          transition={200}
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
          <Text variant={INITIALS_VARIANT[size]} color="secondary">
            {initials}
          </Text>
        </View>
      )}
    </View>
  );

  if (hasStoryRing) {
    return (
      <LinearGradient
        colors={[...theme.colors.accentGradient]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            width: totalSize,
            height: totalSize,
            borderRadius: totalSize / 2,
            padding: borderWidth,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? displayName ?? 'Avatar with story'}
      >
        {imageEl}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[{ width: totalSize, height: totalSize }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? displayName ?? 'Avatar'}
    >
      {imageEl}
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
