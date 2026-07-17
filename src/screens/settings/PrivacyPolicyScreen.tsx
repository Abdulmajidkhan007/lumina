/**
 * Lumina — Privacy Policy screen
 *
 * Static themed policy text. Real legal copy lives on the marketing site in
 * production; this in-app version gives users something real to read
 * rather than a dead tap target.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrivacyPolicyScreen(): React.JSX.Element {
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
        title={t('privacyPolicyScreen.title')}
        onBack={goBack}
        backAccessibilityLabel={t('privacyPolicyScreen.goBack')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing['6xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          variant="caption"
          color="tertiary"
          style={{ marginBottom: theme.spacing.lg }}
        >
          {t('privacyPolicyScreen.lastUpdated')}
        </Text>
        <Text variant="body" color="secondary">
          {t('privacyPolicyScreen.body')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    // padding applied inline via theme spacing
  },
});
