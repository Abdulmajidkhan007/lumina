/**
 * Lumina — Notifications Settings screen
 *
 * Push / likes / comments / follows toggles. Kept as local component state
 * (no dedicated notification-preferences data hook exists yet) so the
 * screen is fully interactive rather than a dead tap target.
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

export default function NotificationsSettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [likesEnabled, setLikesEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [followsEnabled, setFollowsEnabled] = useState(true);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('notificationsSettings.title')}
        onBack={goBack}
        backAccessibilityLabel={t('notificationsSettings.goBack')}
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
            icon="notifications-outline"
            label={t('notificationsSettings.pushLabel')}
            sublabel={t('notificationsSettings.pushDescription')}
            right={{ type: 'switch', value: pushEnabled, onValueChange: setPushEnabled }}
            accessibilityLabel={t('notificationsSettings.pushLabel')}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            icon="heart-outline"
            label={t('notificationsSettings.likesLabel')}
            sublabel={t('notificationsSettings.likesDescription')}
            right={{
              type: 'switch',
              value: likesEnabled,
              onValueChange: setLikesEnabled,
            }}
            accessibilityLabel={t('notificationsSettings.likesLabel')}
          />
          <SettingsRow
            icon="chatbubble-outline"
            label={t('notificationsSettings.commentsLabel')}
            sublabel={t('notificationsSettings.commentsDescription')}
            right={{
              type: 'switch',
              value: commentsEnabled,
              onValueChange: setCommentsEnabled,
            }}
            accessibilityLabel={t('notificationsSettings.commentsLabel')}
          />
          <SettingsRow
            icon="person-add-outline"
            label={t('notificationsSettings.followsLabel')}
            sublabel={t('notificationsSettings.followsDescription')}
            right={{
              type: 'switch',
              value: followsEnabled,
              onValueChange: setFollowsEnabled,
            }}
            accessibilityLabel={t('notificationsSettings.followsLabel')}
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
