/**
 * Lumina — Settings screen
 *
 * Sectioned settings list with Account, Preferences, Privacy, Support,
 * and a danger Log Out row.
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import { ConfirmDialog } from '@/components';
import { useAuthStore, useCurrentUser } from '@/stores/auth.store';
import { useSetProfessionalAccount } from '@/data/query/hooks/useSetProfessionalAccount';
import { usePreferencesStore, useLocale } from '@/stores/preferences.store';
import type { AppLocale } from '@/stores/preferences.store';
import { authApi } from '@/data/api/client';
import { useDeleteAccount } from '@/data/query/hooks';
import { hitSlop } from '@/constants/layout';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { LanguagePicker, LANGUAGE_OPTIONS } from '@/features/settings/components/LanguagePicker';
import { setAppLocale } from '@/i18n';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const clearSession = useAuthStore((s) => s.clearSession);
  const currentUser = useCurrentUser();
  const setProfessional = useSetProfessionalAccount();
  const isProfessional = currentUser?.isProfessional ?? false;
  const { autoplayVideos, hapticsEnabled, setAutoplayVideos, setHapticsEnabled } =
    usePreferencesStore();
  const locale = useLocale();
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const goToEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const goToChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const goToSavedPosts = useCallback(() => {
    navigation.navigate('SavedPosts');
  }, [navigation]);

  const goToArchive = useCallback(() => {
    navigation.navigate('Archive');
  }, [navigation]);

  const goToCloseFriends = useCallback(() => {
    navigation.navigate('CloseFriends');
  }, [navigation]);

  const goToInsights = useCallback(() => {
    navigation.navigate('Insights');
  }, [navigation]);

  const handleToggleProfessional = useCallback(() => {
    if (isProfessional) {
      Alert.alert('Switch to personal account?', 'You will lose access to Insights.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => setProfessional.mutate(false) },
      ]);
    } else {
      setProfessional.mutate(true, {
        onSuccess: () => navigation.navigate('Insights'),
      });
    }
  }, [isProfessional, setProfessional, navigation]);

  const goToNotificationsSettings = useCallback(() => {
    navigation.navigate('NotificationsSettings');
  }, [navigation]);

  const goToPrivacy = useCallback(() => {
    navigation.navigate('Privacy');
  }, [navigation]);

  const goToBlockedAccounts = useCallback(() => {
    navigation.navigate('BlockedAccounts');
  }, [navigation]);

  const goToActivityStatus = useCallback(() => {
    navigation.navigate('ActivityStatus');
  }, [navigation]);

  const goToHelpCentre = useCallback(() => {
    navigation.navigate('HelpCentre');
  }, [navigation]);

  const goToPrivacyPolicy = useCallback(() => {
    navigation.navigate('PrivacyPolicy');
  }, [navigation]);

  const goToAbout = useCallback(() => {
    navigation.navigate('About');
  }, [navigation]);

  const openLogoutDialog = useCallback(() => setLogoutDialogVisible(true), []);
  const closeLogoutDialog = useCallback(() => setLogoutDialogVisible(false), []);

  const openDeleteDialog = useCallback(() => setDeleteDialogVisible(true), []);
  const closeDeleteDialog = useCallback(() => setDeleteDialogVisible(false), []);

  const handleConfirmSignOut = useCallback(() => {
    setLogoutDialogVisible(false);
    void (async () => {
      try {
        await authApi.logout();
      } finally {
        clearSession();
      }
    })();
  }, [clearSession]);

  const handleConfirmDeleteAccount = useCallback(() => {
    setDeleteDialogVisible(false);
    deleteAccountMutation.mutate(undefined, {
      onError: (error) => {
        Alert.alert(t('common.error'), error.message, [{ text: t('common.ok') }]);
      },
    });
  }, [deleteAccountMutation, t]);

  const handleAutoplayChange = useCallback(
    (v: boolean) => setAutoplayVideos(v),
    [setAutoplayVideos],
  );

  const handleHapticsChange = useCallback(
    (v: boolean) => setHapticsEnabled(v),
    [setHapticsEnabled],
  );

  const currentLanguageOption = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[3],
    [locale],
  );

  const currentLanguageLabel = useMemo(
    () => `${currentLanguageOption.flag} ${t(currentLanguageOption.labelKey)}`,
    [currentLanguageOption, t],
  );

  const openLanguagePicker = useCallback(() => {
    setLanguagePickerVisible(true);
  }, []);

  const closeLanguagePicker = useCallback(() => {
    setLanguagePickerVisible(false);
  }, []);

  const handleSelectLocale = useCallback((next: AppLocale) => {
    setAppLocale(next);
    setLanguagePickerVisible(false);
  }, []);

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
            onPress={goToChangePassword}
            accessibilityLabel={t('settings.rows.changePassword')}
          />
          <SettingsRow
            icon="notifications-outline"
            label={t('settings.rows.notifications')}
            onPress={goToNotificationsSettings}
            accessibilityLabel={t('settings.rows.notifications')}
          />
          <SettingsRow
            icon="bookmark-outline"
            label={t('settings.rows.saved')}
            onPress={goToSavedPosts}
            accessibilityLabel={t('settings.rows.saved')}
          />
          <SettingsRow
            icon="archive-outline"
            label={t('settings.rows.archive')}
            onPress={goToArchive}
            accessibilityLabel={t('settings.rows.archive')}
          />
          <SettingsRow
            icon="star-outline"
            label={t('settings.rows.closeFriends')}
            onPress={goToCloseFriends}
            accessibilityLabel={t('settings.rows.closeFriends')}
          />
          {isProfessional ? (
            <SettingsRow
              icon="bar-chart-outline"
              label={t('settings.rows.insights')}
              onPress={goToInsights}
              accessibilityLabel={t('settings.rows.insights')}
            />
          ) : null}
          <SettingsRow
            icon="briefcase-outline"
            label={
              isProfessional
                ? t('settings.rows.switchToPersonal')
                : t('settings.rows.switchToProfessional')
            }
            onPress={handleToggleProfessional}
            accessibilityLabel={
              isProfessional
                ? t('settings.rows.switchToPersonal')
                : t('settings.rows.switchToProfessional')
            }
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
            onPress={openLanguagePicker}
            accessibilityLabel={t('settings.rows.language.label')}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title={t('settings.sections.privacy')}>
          <SettingsRow
            icon="eye-off-outline"
            label={t('settings.rows.privateAccount')}
            onPress={goToPrivacy}
            accessibilityLabel={t('settings.rows.privateAccount')}
          />
          <SettingsRow
            icon="hand-left-outline"
            label={t('settings.rows.blockedAccounts')}
            onPress={goToBlockedAccounts}
            accessibilityLabel={t('settings.rows.blockedAccounts')}
          />
          <SettingsRow
            icon="share-social-outline"
            label={t('settings.rows.activityStatus')}
            onPress={goToActivityStatus}
            accessibilityLabel={t('settings.rows.activityStatus')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title={t('settings.sections.support')}>
          <SettingsRow
            icon="help-circle-outline"
            label={t('settings.rows.helpCentre')}
            onPress={goToHelpCentre}
            accessibilityLabel={t('settings.rows.helpCentre')}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t('settings.rows.privacyPolicy')}
            onPress={goToPrivacyPolicy}
            accessibilityLabel={t('settings.rows.privacyPolicy')}
          />
          <SettingsRow
            icon="information-circle-outline"
            label={t('settings.rows.aboutLumina')}
            onPress={goToAbout}
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
            onPress={openLogoutDialog}
            accessibilityLabel={t('settings.rows.logout')}
          />
          <SettingsRow
            icon="trash-outline"
            label={
              deleteAccountMutation.isPending
                ? t('common.loading')
                : t('settings.rows.deleteAccount')
            }
            right={{ type: 'none' }}
            danger
            onPress={deleteAccountMutation.isPending ? undefined : openDeleteDialog}
            accessibilityLabel={t('settings.rows.deleteAccount')}
          />
        </SettingsSection>
      </ScrollView>

      {/* Language picker — centered modal with flags */}
      <LanguagePicker
        visible={languagePickerVisible}
        locale={locale}
        onSelect={handleSelectLocale}
        onClose={closeLanguagePicker}
      />

      {/* Log out confirmation */}
      <ConfirmDialog
        visible={logoutDialogVisible}
        title={t('settings.logoutConfirm.title')}
        message={t('settings.logoutConfirm.message')}
        confirmLabel={t('settings.logoutConfirm.confirm')}
        cancelLabel={t('settings.logoutConfirm.cancel')}
        destructive
        onConfirm={handleConfirmSignOut}
        onCancel={closeLogoutDialog}
      />

      {/* Delete account confirmation */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title={t('settings.deleteConfirm.title')}
        message={t('settings.deleteConfirm.message')}
        confirmLabel={t('settings.deleteConfirm.confirm')}
        cancelLabel={t('settings.deleteConfirm.cancel')}
        destructive
        onConfirm={handleConfirmDeleteAccount}
        onCancel={closeDeleteDialog}
      />
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
