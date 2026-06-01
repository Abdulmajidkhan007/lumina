/**
 * Lumina — Notifications (Activity) screen
 *
 * - Header: back button + "Activity" title.
 * - On mount, marks all notifications read (optimistic via useMarkNotificationsRead).
 * - Delegates list rendering to NotificationList (loading/empty/error/paginated).
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { useMarkNotificationsRead } from '@/data/query/hooks/useMarkNotificationsRead';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { mutate: markAllRead } = useMarkNotificationsRead();

  // Mark all read when the screen mounts.
  // The mutation is optimistic — the cache is updated immediately and rolled
  // back if the server call fails. No cleanup needed (fire-and-forget).
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const goBack = useCallback(() => router.back(), [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* ---- Header ---- */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
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

        <Text variant="bodyStrong" color="primary">
          Activity
        </Text>

        {/* Spacer keeps the title centred between back button and right edge */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ---- List ---- */}
      <View style={styles.body}>
        <NotificationList />
      </View>
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
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 24,
  },
  body: {
    flex: 1,
  },
});
