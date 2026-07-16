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
import { Sheet } from '@/design-system/primitives/Sheet';
import { useAuthStore } from '@/stores/auth.store';
import { usePreferencesStore, useLocale } from '@/stores/preferences.store';
import type { AppLocale } from '@/stores/preferences.store';
import { authApi } from '@/data/api/client';
import { useDeleteAccount } from '@/data/query/hooks';
import { hitSlop } from '@/constants/layout';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { setAppLocale } from '@/i18n';

// ---------------------------------------------------------------------------
// Language picker options — order shown in the Sheet: English, Русский,
// O'zbekcha, System. `as const` keeps `labelKey` narrowed to the literal
// translation-key union so `t()` stays type-checked.
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { locale: 'en', labelKey: 'settings.rows.language.english' },
  { locale: 'ru', labelKey: 'settings.rows.language.russian' },
  { locale: 'uz', labelKey: 'settings.rows.language.uzbek' },
  { locale: 'system', labelKey: 'settings.rows.language.system' },
] as const satisfies ReadonlyArray<{ locale: AppLocale; labelKey: string }>;

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
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

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

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.deleteConfirm.title'),
      t('settings.deleteConfirm.message'),
      [
        { text: t('settings.deleteConfirm.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteConfirm.confirm'),
          style: 'destructive',
          onPress: () => {
            deleteAccountMutation.mutate(undefined, {
              onError: (error) => {
                Alert.alert(t('common.error'), error.message, [
                  { text: t('common.ok') },
                ]);
              },
            });
          },
        },
      ],
    );
  }, [deleteAccountMutation, t]);

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
      case 'ru':
        return t('settings.rows.language.russian');
      case 'uz':
        return t('settings.rows.language.uzbek');
      case 'system':
      default:
        return t('settings.rows.language.system');
    }
  }, [locale, t]);

  const openLanguageSheet = useCallback(() => {
    setLanguageSheetVisible(true);
  }, []);

  const closeLanguageSheet = useCallback(() => {
    setLanguageSheetVisible(false);
  }, []);

  const handleSelectLocale = useCallback((next: AppLocale) => {
    setAppLocale(next);
    setLanguageSheetVisible(false);
  }, []);

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
            onPress={openLanguageSheet}
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
          <SettingsRow
            icon="trash-outline"
            label={
              deleteAccountMutation.isPending
                ? t('common.loading')
                : t('settings.rows.deleteAccount')
            }
            right={{ type: 'none' }}
            danger
            onPress={deleteAccountMutation.isPending ? undefined : handleDeleteAccount}
            accessibilityLabel={t('settings.rows.deleteAccount')}
          />
        </SettingsSection>
      </ScrollView>

      {/* Language picker sheet */}
      <Sheet visible={languageSheetVisible} onDismiss={closeLanguageSheet}>
        <Text
          variant="bodyStrong"
          color="primary"
          style={[
            styles.languageSheetTitle,
            { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
          ]}
        >
          {t('settings.rows.language.label')}
        </Text>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = locale === option.locale;
          return (
            <Pressable
              key={option.locale}
              onPress={() => handleSelectLocale(option.locale)}
              style={[
                styles.languageRow,
                { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t(option.labelKey)}
              accessibilityState={{ selected: isActive }}
            >
              <Text variant="callout" color="primary">
                {t(option.labelKey)}
              </Text>
              {isActive ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.accent}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
            </Pressable>
          );
        })}
      </Sheet>
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
  languageSheetTitle: {
    // padding applied inline via theme spacing
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
