/**
 * Lumina — Verify-email banner
 *
 * A slim, accent-tinted, dismissible banner shown above the protected app
 * shell for signed-in users whose email address isn't verified yet
 * (Google-authenticated users are always treated as verified — see
 * `IAuthApi.isEmailVerified`). Renders nothing once verified, dismissed, or
 * after a successful resend — all of which are "for this session" states
 * held in local component state, so they reset on next cold start.
 */
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { authApi } from '@/data/api/client';
import { useResendVerificationEmail } from '@/data/query/hooks';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';

export function VerifyEmailBanner(): React.JSX.Element | null {
  const theme = useTheme();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [resendSucceeded, setResendSucceeded] = useState(false);
  const resendMutation = useResendVerificationEmail();

  const handleResend = useCallback(() => {
    resendMutation.mutate(undefined, {
      onSuccess: () => setResendSucceeded(true),
    });
  }, [resendMutation]);

  const handleDismiss = useCallback(() => setDismissed(true), []);

  if (dismissed || resendSucceeded || authApi.isEmailVerified()) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.accent,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            gap: theme.spacing.sm,
          },
        ]}
        accessibilityRole="alert"
      >
        <Ionicons name="mail-unread-outline" size={16} color={theme.colors.accent} />
        <Text variant="caption" color="secondary" style={styles.message}>
          {t('auth.verifyEmail.message')}
        </Text>
        <Pressable
          onPress={handleResend}
          hitSlop={hitSlop.sm}
          disabled={resendMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('auth.verifyEmail.resend')}
        >
          <Text variant="caption" color="accent">
            {resendMutation.isPending
              ? t('auth.verifyEmail.sending')
              : t('auth.verifyEmail.resend')}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel={t('auth.verifyEmail.dismiss')}
        >
          <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  message: {
    flex: 1,
  },
});
