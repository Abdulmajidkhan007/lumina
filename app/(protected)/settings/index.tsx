/**
 * Lumina — Settings screen
 *
 * Placeholder. Shows app settings and account options.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useAuthStore } from '@/stores/auth.store';
import { hitSlop } from '@/constants/layout';

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  const goBack = useCallback(() => router.back(), [router]);

  const goToEditProfile = useCallback(() => {
    router.push('/(protected)/settings/edit-profile');
  }, [router]);

  const handleSignOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.body, { padding: theme.spacing['2xl'], gap: theme.spacing.lg }]}>
        <Button
          label="Edit Profile"
          variant="secondary"
          size="md"
          fullWidth
          onPress={goToEditProfile}
          accessibilityLabel="Edit your profile"
        />
        <Button
          label="Sign out"
          variant="danger"
          size="md"
          fullWidth
          onPress={handleSignOut}
          accessibilityLabel="Sign out of Lumina"
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
  body: {
    flex: 1,
  },
});
