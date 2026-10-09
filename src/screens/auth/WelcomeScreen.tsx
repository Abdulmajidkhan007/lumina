/**
 * Lumina — Welcome screen (first launch only)
 *
 * Ported from the earlier Expo prototype (social-app's onboarding): brand
 * mark, one-line promise, two clear paths — create an account or log in.
 * The prototype used a remote picsum photo as background; here it is the
 * theme background with the gradient wordmark (as on Login), so it works
 * offline, never shows a stranger's picture and stays readable in light mode. Either button marks the screen as seen (preferences store), so a
 * signed-out returning user lands on Login directly.
 */

import React, { useCallback } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AuthStackParamList } from '@/navigation';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { GradientText } from '@/design-system/primitives/GradientText';
import { usePreferencesStore } from '@/stores/preferences.store';

const LUMINA_MARK = require('../../../assets/images/lumina-mark.png');
const PRIVACY_URL = 'https://abdulmajidkhan007.github.io/lumina/privacy-policy.html';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const markWelcomeSeen = usePreferencesStore((s) => s.markWelcomeSeen);

  const go = useCallback(
    (route: 'Signup' | 'Login') => {
      markWelcomeSeen();
      // replace: Back from Login/Signup must not return to the welcome screen.
      navigation.replace(route);
    },
    [markWelcomeSeen, navigation],
  );

  return (
    <SafeAreaView
      style={[
        styles.flex,
        { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing['2xl'] },
      ]}
    >
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.duration(500)}
        style={styles.top}
      >
        <Image source={LUMINA_MARK} style={styles.mark} resizeMode="contain" />
        <GradientText variant="title" style={styles.wordmark}>
          Lumina
        </GradientText>
        <Text variant="callout" color="secondary" align="center">
          {t('auth.welcome.tagline')}
        </Text>
      </Animated.View>

      <View style={[styles.bottom, { gap: theme.spacing.md, paddingBottom: theme.spacing.xl }]}>
        <Button
          label={t('auth.welcome.getStarted')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => go('Signup')}
        />
        <Button
          label={t('auth.welcome.login')}
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => go('Login')}
        />
        <Text variant="caption" color="tertiary" align="center" style={styles.terms}>
          {t('auth.welcome.termsPrefix')}{' '}
          <Text
            variant="caption"
            color="secondary"
            style={styles.link}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
            accessibilityRole="link"
          >
            {t('auth.welcome.privacy')}
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  mark: { width: 96, height: 96 },
  wordmark: { fontSize: 44, lineHeight: 52 },
  bottom: {},
  terms: { marginTop: 4 },
  link: { textDecorationLine: 'underline' },
});
