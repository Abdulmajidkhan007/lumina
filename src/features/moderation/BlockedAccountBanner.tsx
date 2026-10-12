/**
 * Shown above the app shell while the account is in userBans/{uid}: the
 * rules reject every write, so explain why posting/liking fails.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { useIsBlocked } from './useAccountBootstrap';

export function BlockedAccountBanner(): React.JSX.Element | null {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const blocked = useIsBlocked();
  if (!blocked) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.danger,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <Ionicons name="ban-outline" size={16} color={theme.colors.danger} />
      <Text variant="caption" color="secondary" style={styles.message}>
        {t('account.blockedBanner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  message: { flex: 1 },
});
