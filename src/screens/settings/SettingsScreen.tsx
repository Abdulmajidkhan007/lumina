/**
 * Lumina — Settings screen
 *
 * Sectioned settings list with Account, Preferences, Privacy, Support,
 * and a danger Log Out row.
 */

import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import { useAuthStore } from '@/stores/auth.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { authApi } from '@/data/api/client';
import { hitSlop } from '@/constants/layout';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const clearSession = useAuthStore((s) => s.clearSession);
  const { autoplayVideos, hapticsEnabled, setAutoplayVideos, setHapticsEnabled } =
    usePreferencesStore();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const goToEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out of Lumina?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logout();
            } finally {
              clearSession();
            }
          },
        },
      ],
    );
  }, [clearSession]);

  const handleAutoplayChange = useCallback(
    (v: boolean) => setAutoplayVideos(v),
    [setAutoplayVideos],
  );

  const handleHapticsChange = useCallback(
    (v: boolean) => setHapticsEnabled(v),
    [setHapticsEnabled],
  );

  const noop = useCallback(() => {}, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Navigation Header */}
      <View
        style={[
          styles.navHeader,
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
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing['6xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            onPress={goToEditProfile}
            accessibilityLabel="Edit your profile"
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={noop}
            accessibilityLabel="Change your password"
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={noop}
            accessibilityLabel="Notification settings"
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          {/* Theme toggle sits inside its own padded row */}
          <View style={{ paddingTop: theme.spacing.sm }}>
            <Text
              variant="callout"
              color="primary"
              style={{ paddingHorizontal: theme.spacing.lg }}
            >
              Appearance
            </Text>
            <ThemeToggle />
          </View>
          <Divider mx={theme.spacing.lg} />
          <SettingsRow
            icon="play-circle-outline"
            label="Autoplay videos"
            right={{
              type: 'switch',
              value: autoplayVideos,
              onValueChange: handleAutoplayChange,
            }}
            accessibilityLabel="Autoplay videos"
          />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Haptic feedback"
            right={{
              type: 'switch',
              value: hapticsEnabled,
              onValueChange: handleHapticsChange,
            }}
            accessibilityLabel="Haptic feedback"
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy">
          <SettingsRow
            icon="eye-off-outline"
            label="Private account"
            onPress={noop}
            accessibilityLabel="Private account settings"
          />
          <SettingsRow
            icon="hand-left-outline"
            label="Blocked accounts"
            onPress={noop}
            accessibilityLabel="Blocked accounts"
          />
          <SettingsRow
            icon="share-social-outline"
            label="Activity status"
            onPress={noop}
            accessibilityLabel="Activity status settings"
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsRow
            icon="help-circle-outline"
            label="Help Centre"
            onPress={noop}
            accessibilityLabel="Help Centre"
          />
          <SettingsRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={noop}
            accessibilityLabel="Privacy Policy"
          />
          <SettingsRow
            icon="information-circle-outline"
            label="About Lumina"
            onPress={noop}
            accessibilityLabel="About Lumina"
          />
        </SettingsSection>

        {/* Log out */}
        <SettingsSection>
          <SettingsRow
            icon="log-out-outline"
            label="Log out"
            right={{ type: 'none' }}
            danger
            onPress={handleSignOut}
            accessibilityLabel="Log out of Lumina"
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
  },
});
