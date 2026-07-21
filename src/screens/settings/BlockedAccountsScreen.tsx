/**
 * Lumina — Blocked Accounts screen
 *
 * Lists the accounts the current user has blocked, each with an Unblock
 * button. Blocked accounts' posts and profiles are hidden across the app.
 */

import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { useBlockedUsers, useSetBlocked } from '@/data/query/hooks/useModeration';
import type { UserId, UserSummary } from '@/types/models';

export default function BlockedAccountsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data: blocked, isLoading } = useBlockedUsers();
  const { mutate: setBlocked } = useSetBlocked();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => (
      <View style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}>
        <Avatar uri={item.avatarUrl ?? undefined} displayName={item.displayName} size="md" />
        <View style={styles.rowText}>
          <Text variant="callout" color="primary" numberOfLines={1}>
            {item.username}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>
        <Pressable
          onPress={() => setBlocked({ id: item.id as UserId, block: false })}
          style={[styles.unblockBtn, { borderColor: theme.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Unblock ${item.username}`}
        >
          <Text variant="caption" color="accent">
            Unblock
          </Text>
        </Pressable>
      </View>
    ),
    [theme, setBlocked],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader
        title={t('blockedAccounts.title')}
        onBack={goBack}
        backAccessibilityLabel={t('blockedAccounts.goBack')}
      />
      {isLoading ? (
        <View style={styles.center}>
          <Spinner size="md" />
        </View>
      ) : (
        <FlatList
          data={blocked ?? []}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: theme.spacing.sm, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon="hand-left-outline"
              title={t('blockedAccounts.emptyTitle')}
              subtitle={t('blockedAccounts.emptySubtitle')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowText: { flex: 1 },
  unblockBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
});
