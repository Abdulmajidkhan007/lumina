/**
 * Lumina — Blocked Accounts screen
 *
 * No block-list data hook exists yet, so this renders the shared EmptyState
 * rather than an empty dead screen — an intentional "nothing here" rather
 * than a broken one.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { EmptyState } from '@/components';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlockedAccountsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('blockedAccounts.title')}
        onBack={goBack}
        backAccessibilityLabel={t('blockedAccounts.goBack')}
      />

      <View style={styles.body}>
        <EmptyState
          icon="hand-left-outline"
          title={t('blockedAccounts.emptyTitle')}
          subtitle={t('blockedAccounts.emptySubtitle')}
        />
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: { flex: 1 },
});
