/**
 * Lumina — Notifications screen
 *
 * Placeholder. Shows activity notifications.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { hitSlop } from '@/constants/layout';

export default function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const goBack = useCallback(() => router.back(), [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
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
          <Ionicons name="arrow-back-outline" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="bodyStrong" color="primary">
          Notifications
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          subtitle="Likes, comments, and follows will appear here."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
});
