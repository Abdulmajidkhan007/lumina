/**
 * Lumina — About screen
 *
 * Static app info: wordmark, version, tagline, contact, and a link through
 * to the in-app Privacy Policy screen.
 */

import React, { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { GradientText } from '@/design-system/primitives/GradientText';
import { Divider } from '@/design-system/primitives/Divider';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Keep in sync with package.json's "version" field.
const APP_VERSION = '0.1.0';
const SUPPORT_EMAIL = 'santexnika.atoyo@gmail.com';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AboutScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const goToPrivacyPolicy = useCallback(() => {
    navigation.navigate('PrivacyPolicy');
  }, [navigation]);

  const handleContactPress = useCallback(() => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('about.title')}
        onBack={goBack}
        backAccessibilityLabel={t('about.goBack')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing['2xl'],
            paddingBottom: theme.spacing['6xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <GradientText variant="title">{t('about.appName')}</GradientText>
          <Text
            variant="callout"
            color="secondary"
            align="center"
            style={{ marginTop: theme.spacing.xs }}
          >
            {t('about.tagline')}
          </Text>
          <Text
            variant="caption"
            color="tertiary"
            align="center"
            style={{ marginTop: theme.spacing.md }}
          >
            {t('about.versionLabel')} {APP_VERSION}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xl,
              overflow: 'hidden',
              marginTop: theme.spacing['2xl'],
              ...theme.shadows.sm,
            },
          ]}
        >
          <Pressable
            onPress={handleContactPress}
            hitSlop={hitSlop.sm}
            style={[styles.row, { padding: theme.spacing.lg }]}
            accessibilityRole="button"
            accessibilityLabel={`${t('about.contactTitle')}: ${SUPPORT_EMAIL}`}
          >
            <View style={styles.rowText}>
              <Text variant="bodyStrong" color="primary">
                {t('about.contactTitle')}
              </Text>
              <Text
                variant="caption"
                color="secondary"
                style={{ marginTop: theme.spacing.xxs }}
              >
                {t('about.contactDescription')}
              </Text>
              <Text
                variant="callout"
                color="accent"
                style={{ marginTop: theme.spacing.xs }}
              >
                {SUPPORT_EMAIL}
              </Text>
            </View>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.textTertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>

          <Divider mx={theme.spacing.lg} />

          <Pressable
            onPress={goToPrivacyPolicy}
            hitSlop={hitSlop.sm}
            style={[
              styles.row,
              { padding: theme.spacing.lg, justifyContent: 'space-between' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('about.privacyPolicyLink')}
          >
            <Text variant="bodyStrong" color="primary">
              {t('about.privacyPolicyLink')}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textTertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        </View>

        <Text
          variant="caption"
          color="tertiary"
          align="center"
          style={{ marginTop: theme.spacing['2xl'] }}
        >
          {t('about.madeWith')}
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
  brandBlock: {
    alignItems: 'center',
  },
  card: {
    // surface + borderRadius applied inline
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
});
