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
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop, headerHeight } from '@/constants/layout';

// Bundled brand mark (gradient rounded square + luminous spark).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LUMINA_MARK = require('../../../../assets/images/lumina-mark.png');

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
      {/* Brand: logo mark + wordmark. Fixed sizes so the row never collapses. */}
      <View style={styles.brand}>
        <Image source={LUMINA_MARK} style={styles.mark} resizeMode="contain" />
        <Text variant="title" numberOfLines={1} style={styles.wordmark}>
          Lumina
        </Text>
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  wordmark: {
    letterSpacing: 0.3,
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
