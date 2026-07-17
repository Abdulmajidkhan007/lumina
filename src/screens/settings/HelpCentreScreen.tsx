/**
 * Lumina — Help Centre screen
 *
 * Static themed support info: a short intro, a contact card that opens the
 * device's mail client, and a small FAQ. No backend hook is needed — this
 * is intentionally static content, not a broken placeholder.
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
import { Divider } from '@/design-system/primitives/Divider';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORT_EMAIL = 'santexnika.atoyo@gmail.com';

const FAQ_KEYS = [
  { questionKey: 'helpCentre.faq1Question', answerKey: 'helpCentre.faq1Answer' },
  { questionKey: 'helpCentre.faq2Question', answerKey: 'helpCentre.faq2Answer' },
  { questionKey: 'helpCentre.faq3Question', answerKey: 'helpCentre.faq3Answer' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelpCentreScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleContactPress = useCallback(() => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('helpCentre.title')}
        onBack={goBack}
        backAccessibilityLabel={t('helpCentre.goBack')}
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
          variant="callout"
          color="secondary"
          style={{ marginBottom: theme.spacing.xl }}
        >
          {t('helpCentre.intro')}
        </Text>

        {/* Contact card */}
        <Pressable
          onPress={handleContactPress}
          hitSlop={hitSlop.sm}
          style={[
            styles.contactCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing['2xl'],
              ...theme.shadows.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${t('helpCentre.contactTitle')}: ${SUPPORT_EMAIL}`}
        >
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor: theme.colors.background,
                borderRadius: theme.radii.lg,
                marginRight: theme.spacing.md,
              },
            ]}
          >
            <Ionicons name="mail-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.contactTextBlock}>
            <Text variant="bodyStrong" color="primary">
              {t('helpCentre.contactTitle')}
            </Text>
            <Text
              variant="caption"
              color="secondary"
              style={{ marginTop: theme.spacing.xxs }}
            >
              {t('helpCentre.contactDescription')}
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
            name="chevron-forward"
            size={18}
            color={theme.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>

        {/* FAQ */}
        <Text
          variant="overline"
          color="tertiary"
          style={{
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
          }}
        >
          {t('helpCentre.faqTitle')}
        </Text>
        <View
          style={[
            styles.faqCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xl,
              overflow: 'hidden',
              ...theme.shadows.sm,
            },
          ]}
        >
          {FAQ_KEYS.map((item, index) => (
            <React.Fragment key={item.questionKey}>
              <View style={{ padding: theme.spacing.lg }}>
                <Text
                  variant="bodyStrong"
                  color="primary"
                  style={{ marginBottom: theme.spacing.xs }}
                >
                  {t(item.questionKey)}
                </Text>
                <Text variant="callout" color="secondary">
                  {t(item.answerKey)}
                </Text>
              </View>
              {index < FAQ_KEYS.length - 1 ? <Divider mx={theme.spacing.lg} /> : null}
            </React.Fragment>
          ))}
        </View>
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextBlock: {
    flex: 1,
  },
  faqCard: {
    // surface + borderRadius applied inline
  },
});
