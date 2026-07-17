/**
 * Lumina — Activity Status screen
 *
 * Single toggle controlling whether followed accounts can see when you were
 * last active. No presence data hook exists yet, so this is local component
 * state — a real, interactive toggle rather than a dead row.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityStatusScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('activityStatus.title')}
        onBack={goBack}
        backAccessibilityLabel={t('activityStatus.goBack')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing['6xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          <SettingsRow
            icon="share-social-outline"
            label={t('activityStatus.label')}
            sublabel={t('activityStatus.description')}
            right={{
              type: 'switch',
              value: activityStatusEnabled,
              onValueChange: setActivityStatusEnabled,
            }}
            accessibilityLabel={t('activityStatus.label')}
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
  },
});
