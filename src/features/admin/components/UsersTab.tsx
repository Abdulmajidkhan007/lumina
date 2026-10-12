import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Button } from '@/design-system/primitives/Button';
import { EmptyState } from '@/components/EmptyState';
import { getFirebaseAuth } from '@/lib/firebase';
import { ADMIN_EMAIL } from '@/data/services/activityLog';
import type { AdminUserRow } from '@/data/services/admin';
import { canBlockUser, canEditRole, USER_ROLES, type UserRole } from '@/utils/admin';
import { formatRelativeTime } from '@/utils/format';
import { useAdminUsers, useBanUser, useSetUserRole, useUnbanUser } from '../hooks/useAdminData';
import { StatusPill } from './AdminPrimitives';
import { ReasonModal } from './ReasonModal';
import { TabError, TabLoading, errorMessage } from './shared';

const SEARCH_DEBOUNCE_MS = 350;

export function UsersTab({ actorRole }: { actorRole: UserRole }): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null);
  const { data, error, isLoading, refetch } = useAdminUsers(term);
  const setRole = useSetUserRole();
  const ban = useBanUser();
  const unban = useUnbanUser();
  const myUid = getFirebaseAuth().currentUser?.uid ?? null;
  const mutationError = setRole.error ?? ban.error ?? unban.error;

  useEffect(() => {
    const id = setTimeout(() => setTerm(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const renderItem = useCallback(
    ({ item }: { item: AdminUserRow }) => {
      if (!data) return null;
      const email = data.emails.get(item.id) ?? null;
      const isOwner = email === ADMIN_EMAIL;
      const role: UserRole = isOwner ? 'admin' : data.roles.get(item.id) ?? 'user';
      const banned = data.bans.get(item.id);
      const isSelf = item.id === myUid;
      const editable = canEditRole({ actor: actorRole, isSelf, isOwner });
      const blockable = canBlockUser({ actor: actorRole, target: role, isSelf, isOwner });
      return (
        <View style={[styles.row, { borderBottomColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm }]}>
          <View style={[styles.line, { gap: theme.spacing.md }]}>
            <Avatar uri={item.avatarUrl ?? undefined} displayName={item.displayName} size="sm" />
            <View style={styles.flex}>
              <Text variant="callout" color="primary" numberOfLines={1}>
                {item.displayName} <Text variant="callout" color="secondary">@{item.username}</Text>
              </Text>
              <Text variant="caption" color="tertiary" numberOfLines={1}>
                {[email, t('users.posts', { n: item.postCount })].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="caption" color="tertiary">
                {item.lastActiveAt ? t('users.lastActive', { when: formatRelativeTime(item.lastActiveAt) }) : t('users.neverSeen')}
              </Text>
            </View>
            {banned ? <StatusPill tone="danger" label={t('users.blocked')} /> : null}
          </View>
          {banned?.reason ? (
            <Text variant="caption" color="danger" numberOfLines={2}>
              {banned.reason}
            </Text>
          ) : null}
          <View style={[styles.line, styles.wrap, { gap: theme.spacing.sm }]}>
            {USER_ROLES.map((r) => {
              const selected = r === role;
              if (!editable && !selected) return null;
              return (
                <Pressable
                  key={r}
                  disabled={!editable || selected || setRole.isPending}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('users.roleA11y', { username: item.username, role: t(`users.roles.${r}`) })}
                  onPress={() => setRole.mutate({ uid: item.id, role: r })}
                  style={[
                    styles.roleChip,
                    {
                      borderRadius: theme.radii.full,
                      paddingHorizontal: theme.spacing.md,
                      borderColor: selected ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <Text variant="caption" color={selected ? 'accent' : 'secondary'}>
                    {t(`users.roles.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.flex} />
            {blockable ? (
              banned ? (
                <Button
                  label={t('users.unblock')}
                  variant="secondary"
                  size="sm"
                  loading={unban.isPending && unban.variables === item.id}
                  onPress={() => unban.mutate(item.id)}
                />
              ) : (
                <Button label={t('users.block')} variant="danger" size="sm" onPress={() => setBanTarget(item)} />
              )
            ) : null}
          </View>
        </View>
      );
    },
    [actorRole, data, myUid, setRole, t, theme, unban],
  );

  return (
    <View style={styles.flex}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('users.searchPlaceholder')}
        placeholderTextColor={theme.colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.search,
          {
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            margin: theme.spacing.lg,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      />
      {mutationError ? (
        <Text variant="caption" color="danger" style={{ paddingHorizontal: theme.spacing.lg }}>
          {errorMessage(mutationError, t('common.error'))}
        </Text>
      ) : null}
      {isLoading ? (
        <TabLoading />
      ) : error || !data ? (
        <TabError error={error} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data.users}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon="people-outline" title={t('users.empty')} />}
        />
      )}
      <ReasonModal
        visible={banTarget !== null}
        title={t('users.blockTitle', { username: banTarget?.username ?? '' })}
        message={t('users.blockMessage')}
        confirmLabel={t('users.block')}
        loading={ban.isPending}
        onCancel={() => setBanTarget(null)}
        onConfirm={(reason) => {
          if (!banTarget) return;
          ban.mutate({ uid: banTarget.id, reason }, { onSuccess: () => setBanTarget(null) });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  line: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  roleChip: { borderWidth: 1, paddingVertical: 4 },
  search: { borderWidth: 1 },
});
