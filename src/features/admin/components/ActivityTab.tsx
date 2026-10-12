import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { formatRelativeTime } from '@/utils/format';
import { useAdminJournal, useUserActivity } from '../hooks/useAdminData';
import { ChipRow } from './AdminPrimitives';
import { TabError, TabLoading } from './shared';

type Source = 'admin' | 'users';

interface Row {
  id: string;
  type: string;
  who: string;
  detail: string;
  createdAt: string;
}

export function ActivityTab(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [source, setSource] = useState<Source>('admin');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const journal = useAdminJournal();
  const activity = useUserActivity();
  const query = source === 'admin' ? journal : activity;

  const rows = useMemo<Row[]>(() => {
    if (source === 'admin') {
      return (journal.data ?? []).map((e) => ({
        id: e.id,
        type: e.action,
        who: e.actor,
        detail: [e.target, e.note].filter(Boolean).join(' — '),
        createdAt: e.createdAt,
      }));
    }
    return (activity.data ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      who: e.email ?? e.uid ?? '—',
      detail: [e.meta.targetId ?? e.meta.postId ?? '', e.platform].filter(Boolean).join(' · '),
      createdAt: e.createdAt,
    }));
  }, [activity.data, journal.data, source]);

  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (type === 'all' || r.type === type) &&
        (q === '' || r.who.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q)),
    );
  }, [rows, search, type]);

  const header = (
    <View>
      <ChipRow<Source>
        accessibilityLabel={t('tabs.activity')}
        value={source}
        onChange={(s) => {
          setSource(s);
          setType('all');
        }}
        options={[
          { value: 'admin', label: t('activity.adminActions') },
          { value: 'users', label: t('activity.userEvents') },
        ]}
      />
      <ChipRow<string>
        accessibilityLabel={t('activity.allTypes')}
        value={type}
        onChange={setType}
        options={[{ value: 'all', label: t('activity.allTypes') }, ...types.map((ty) => ({ value: ty, label: ty.replace(/_/g, ' ') }))]}
      />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('activity.filterPlaceholder')}
        placeholderTextColor={theme.colors.textTertiary}
        autoCapitalize="none"
        style={[
          styles.search,
          {
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      />
    </View>
  );

  if (query.isLoading) return <TabLoading />;
  if (query.error) return <TabError error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <FlatList
      data={visible}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      renderItem={({ item }) => (
        <View style={[styles.row, { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }]}>
          <Text variant="callout" color="primary" numberOfLines={1}>
            <Text variant="callout" color="accent">
              {item.type.replace(/_/g, ' ')}
            </Text>{' '}
            · {item.who}
          </Text>
          {item.detail ? (
            <Text variant="caption" color="secondary" numberOfLines={2}>
              {item.detail}
            </Text>
          ) : null}
          <Text variant="caption" color="tertiary">
            {item.createdAt ? formatRelativeTime(item.createdAt) : '—'}
          </Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="pulse-outline" title={t('activity.empty')} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  search: { borderWidth: 1 },
});
