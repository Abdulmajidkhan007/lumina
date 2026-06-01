/**
 * Lumina — Profile tab
 *
 * Placeholder screen. Shows current user info when available.
 * Will be replaced by the full profile feature.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useCurrentUser } from '@/stores/auth.store';
import { hitSlop, tabBarHeight } from '@/constants/layout';

export default function ProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const goToSettings = useCallback(() => {
    router.push('/(protected)/settings/index');
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="headline" color="primary">
          {currentUser?.username ?? 'Profile'}
        </Text>
        <Pressable
          onPress={goToSettings}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsButton}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
        {currentUser ? (
          <View style={[styles.profilePreview, { padding: theme.spacing['2xl'] }]}>
            <Avatar
              uri={currentUser.avatarUrl ?? undefined}
              displayName={currentUser.displayName}
              size="xl"
            />
            <Text
              variant="bodyStrong"
              color="primary"
              style={{ marginTop: theme.spacing.md }}
            >
              {currentUser.displayName}
            </Text>
            <Text
              variant="callout"
              color="secondary"
              style={{ marginTop: theme.spacing.xs }}
            >
              @{currentUser.username}
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="person-circle-outline"
            title="Your profile"
            subtitle="Your posts and information will appear here."
          />
        )}
      </View>
    </SafeAreaView>
  );
}

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
  settingsButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  profilePreview: {
    alignItems: 'center',
  },
});
