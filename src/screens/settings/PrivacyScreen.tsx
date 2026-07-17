/**
 * Lumina — Privacy screen
 *
 * Private-account toggle. The canonical `isPrivate` field lives on the
 * user profile (edited via EditProfileScreen + useUpdateProfile), so this
 * screen mirrors it as local UI state rather than duplicating the data
 * mutation — it links out to Edit Profile for the actual save.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { useCurrentUser } from '@/stores/auth.store';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrivacyScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();

  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate ?? false);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('privacy.title')}
        onBack={goBack}
        backAccessibilityLabel={t('privacy.goBack')}
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
            icon="eye-off-outline"
            label={t('privacy.privateAccountLabel')}
            sublabel={t('privacy.privateAccountDescription')}
            right={{ type: 'switch', value: isPrivate, onValueChange: setIsPrivate }}
            accessibilityLabel={t('privacy.privateAccountLabel')}
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
