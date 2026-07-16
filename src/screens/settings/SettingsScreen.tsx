/**
 * Lumina — Settings screen
 *
 * Sectioned settings list with Account, Preferences, Privacy, Support,
 * and a danger Log Out row.
 */

import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import { useAuthStore } from '@/stores/auth.store';
import { usePreferencesStore, useLocale } from '@/stores/preferences.store';
import { authApi } from '@/data/api/client';
import { hitSlop } from '@/constants/layout';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { setAppLocale } from '@/i18n';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const clearSession = useAuthStore((s) => s.clearSession);
  const { autoplayVideos, hapticsEnabled, setAutoplayVideos, setHapticsEnabled } =
    usePreferencesStore();
  const locale = useLocale();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const goToEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('settings.logoutConfirm.title'),
      t('settings.logoutConfirm.message'),
      [
        { text: t('settings.logoutConfirm.cancel'), style: 'cancel' },
        {
          text: t('settings.logoutConfirm.confirm'),
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
  }, [clearSession, t]);

  const handleAutoplayChange = useCallback(
    (v: boolean) => setAutoplayVideos(v),
    [setAutoplayVideos],
  );

  const handleHapticsChange = useCallback(
    (v: boolean) => setHapticsEnabled(v),
    [setHapticsEnabled],
  );

  const currentLanguageLabel = useMemo(() => {
    switch (locale) {
      case 'en':
        return t('settings.rows.language.english');
      case 'uz':
        return t('settings.rows.language.uzbek');
      case 'system':
      default:
        return t('settings.rows.language.system');
    }
  }, [locale, t]);

  const handleLanguagePress = useCallback(() => {
    Alert.alert(t('settings.rows.language.label'), undefined, [
      { text: t('settings.rows.language.english'), onPress: () => setAppLocale('en') },
      { text: t('settings.rows.language.uzbek'), onPress: () => setAppLocale('uz') },
      { text: t('settings.rows.language.system'), onPress: () => setAppLocale('system') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [t]);

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
          accessibilityLabel={t('settings.goBack')}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text variant="bodyStrong" color="primary">
          {t('settings.title')}
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
        <SettingsSection title={t('settings.sections.account')}>
          <SettingsRow
            icon="person-outline"
            label={t('settings.rows.editProfile')}
            onPress={goToEditProfile}
            accessibilityLabel={t('settings.rows.editProfile')}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label={t('settings.rows.changePassword')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.changePassword')}
          />
          <SettingsRow
            icon="notifications-outline"
            label={t('settings.rows.notifications')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.notifications')}
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={t('settings.sections.preferences')}>
          {/* Theme toggle sits inside its own padded row */}
          <View style={{ paddingTop: theme.spacing.sm }}>
            <Text
              variant="callout"
              color="primary"
              style={{ paddingHorizontal: theme.spacing.lg }}
            >
              {t('settings.rows.appearance')}
            </Text>
            <ThemeToggle />
          </View>
          <Divider mx={theme.spacing.lg} />
          <SettingsRow
            icon="play-circle-outline"
            label={t('settings.rows.autoplay')}
            right={{
              type: 'switch',
              value: autoplayVideos,
              onValueChange: handleAutoplayChange,
            }}
            accessibilityLabel={t('settings.rows.autoplay')}
          />
          <SettingsRow
            icon="phone-portrait-outline"
            label={t('settings.rows.haptics')}
            right={{
              type: 'switch',
              value: hapticsEnabled,
              onValueChange: handleHapticsChange,
            }}
            accessibilityLabel={t('settings.rows.haptics')}
          />
          <SettingsRow
            icon="language-outline"
            label={t('settings.rows.language.label')}
            sublabel={currentLanguageLabel}
            onPress={handleLanguagePress}
            accessibilityLabel={t('settings.rows.language.label')}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title={t('settings.sections.privacy')}>
          <SettingsRow
            icon="eye-off-outline"
            label={t('settings.rows.privateAccount')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.privateAccount')}
          />
          <SettingsRow
            icon="hand-left-outline"
            label={t('settings.rows.blockedAccounts')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.blockedAccounts')}
          />
          <SettingsRow
            icon="share-social-outline"
            label={t('settings.rows.activityStatus')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.activityStatus')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title={t('settings.sections.support')}>
          <SettingsRow
            icon="help-circle-outline"
            label={t('settings.rows.helpCentre')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.helpCentre')}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t('settings.rows.privacyPolicy')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.privacyPolicy')}
          />
          <SettingsRow
            icon="information-circle-outline"
            label={t('settings.rows.aboutLumina')}
            onPress={noop}
            accessibilityLabel={t('settings.rows.aboutLumina')}
          />
        </SettingsSection>

        {/* Log out */}
        <SettingsSection>
          <SettingsRow
            icon="log-out-outline"
            label={t('settings.rows.logout')}
            right={{ type: 'none' }}
            danger
            onPress={handleSignOut}
            accessibilityLabel={t('settings.rows.logout')}
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
