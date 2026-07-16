/**
 * Lumina — FeedHeader
 *
 * Top app bar for the home feed:
 * - "Lumina" wordmark on the left, rendered as a solid gradient pill
 *   (never a MaskedView-based mask — see note below)
 * - Heart/notifications icon (push /(protected)/notifications) on the right
 * - Paper-plane/DM icon (push /(protected)/messages) on the right
 *
 * NOTE ON THE WORDMARK: this previously used `GradientText`, which masks a
 * <Text> node through @react-native-masked-view/masked-view. On-device that
 * MaskedView reported a zero/invalid intrinsic size under the New
 * Architecture, which not only made the wordmark invisible but also starved
 * the row's flex layout — pushing the right-hand icons off the edge of the
 * screen. Rendering the wordmark as a plain LinearGradient pill (same
 * approach as LoginScreen) has a real, measurable size and cannot collapse,
 * so the row layout is now stable.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop, headerHeight } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedHeader(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const goToNotifications = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const goToMessages = useCallback(() => {
    navigation.navigate('Messages');
  }, [navigation]);

  return (
    <View
      style={[
        styles.header,
        {
          height: headerHeight.default,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      {/* Wordmark — fixed-size gradient pill, cannot collapse to 0x0 */}
      <View style={styles.wordmarkWrap}>
        <LinearGradient
          colors={[...theme.colors.accentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.wordmarkPill,
            {
              borderRadius: theme.radii.full,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xxs,
            },
          ]}
        >
          <Text variant="bodyStrong" color="inverse" numberOfLines={1}>
            Lumina
          </Text>
        </LinearGradient>
      </View>

      {/* Right icons — fixed intrinsic size, never shrink off-screen */}
      <View style={[styles.icons, { gap: theme.spacing.md }]}>
        <Pressable
          onPress={goToNotifications}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={styles.iconBtn}
        >
          <Ionicons
            name="heart-outline"
            size={26}
            color={theme.colors.textPrimary}
          />
        </Pressable>

        <Pressable
          onPress={goToMessages}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel="Messages"
          style={styles.iconBtn}
        >
          <Ionicons
            name="paper-plane-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordmarkWrap: {
    // Allowed to shrink first if space is ever tight, but the pill itself
    // has real content (padding + text) so it never measures to zero.
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  wordmarkPill: {
    alignSelf: 'flex-start',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    // Icons must always keep their intrinsic size — never shrink/overflow.
    flexShrink: 0,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
