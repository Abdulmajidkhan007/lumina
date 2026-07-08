/**
 * Lumina — FeedHeader
 *
 * Top app bar for the home feed:
 * - "Lumina" gradient wordmark on the left
 * - Heart/notifications icon (push /(protected)/notifications) on the right
 * - Paper-plane/DM icon (push /(protected)/messages) on the right
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { GradientText } from '@/design-system/primitives/GradientText';
import { hitSlop } from '@/constants/layout';

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
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      {/* Wordmark */}
      <GradientText variant="title" style={styles.wordmark}>
        Lumina
      </GradientText>

      {/* Right icons */}
      <View style={styles.icons}>
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
          style={[styles.iconBtn, { marginLeft: theme.spacing.md }]}
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordmark: {
    // Typography via variant prop
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
