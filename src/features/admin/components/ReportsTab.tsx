import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import type { AdminReport } from '@/data/services/admin';
import { isClosedStatus, REPORT_STATUSES, type ReportStatus } from '@/utils/admin';
import { formatRelativeTime } from '@/utils/format';
import { useAdminReports } from '../hooks/useAdminData';
import { ChipRow, StatusPill } from './AdminPrimitives';
import { ReportDetail } from './ReportDetail';
import { STATUS_TONE } from './reportTone';
import { TabError, TabLoading } from './shared';

type Filter = 'active' | ReportStatus | 'all';
const SPLIT_MIN_WIDTH = 768;

export function ReportsTab({ onOpenTarget }: { onOpenTarget: (report: AdminReport) => void }): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { width } = useWindowDimensions();
  const split = width >= SPLIT_MIN_WIDTH;
  const { data, error, isLoading, isRefetching, refetch } = useAdminReports();
  const [filter, setFilter] = useState<Filter>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { active: 0, all: 0, open: 0, reviewing: 0, resolved: 0, dismissed: 0 };
    for (const r of data ?? []) {
      c[r.status] += 1;
      c.all += 1;
      if (!isClosedStatus(r.status)) c.active += 1;
    }
    return c;
  }, [data]);

  const visible = useMemo(
    () =>
      (data ?? []).filter((r) =>
        filter === 'all' ? true : filter === 'active' ? !isClosedStatus(r.status) : r.status === filter,
      ),
    [data, filter],
  );
  const selected = data?.find((r) => r.id === selectedId) ?? null;

  const renderItem = useCallback(
    ({ item }: { item: AdminReport }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: item.id === selectedId }}
        onPress={() => setSelectedId(item.id)}
        style={[
          styles.row,
          {
            borderBottomColor: theme.colors.border,
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: item.id === selectedId ? theme.colors.surface : undefined,
          },
        ]}
      >
        <View style={styles.flex}>
          <Text variant="callout" color="primary" numberOfLines={1}>
            {t(`reports.targets.${item.targetType}`)} · <Text variant="callout" color="secondary">{item.reason || '—'}</Text>
          </Text>
          <Text variant="caption" color="tertiary" numberOfLines={1}>
            {formatRelativeTime(item.createdAt)} · {item.targetId}
          </Text>
        </View>
        <StatusPill tone={STATUS_TONE[item.status]} label={t(`reports.statuses.${item.status}`)} />
      </Pressable>
    ),
    [selectedId, t, theme],
  );

  if (isLoading) return <TabLoading />;
  if (error || !data) return <TabError error={error} onRetry={() => void refetch()} />;

  if (selected && !split) {
    return <ReportDetail report={selected} onBack={() => setSelectedId(null)} onOpenTarget={onOpenTarget} />;
  }

  const filters: { value: Filter; label: string }[] = [
    { value: 'active', label: `${t('reports.filters.active')} (${counts.active})` },
    ...REPORT_STATUSES.map((s) => ({ value: s, label: `${t(`reports.filters.${s}`)} (${counts[s]})` })),
    { value: 'all', label: `${t('reports.filters.all')} (${counts.all})` },
  ];

  const list = (
    <FlatList
      data={visible}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      ListHeaderComponent={
        <ChipRow<Filter> accessibilityLabel={t('reports.filters.all')} value={filter} options={filters} onChange={setFilter} />
      }
      ListEmptyComponent={<EmptyState icon="flag-outline" title={t('reports.empty')} />}
    />
  );

  if (!split) return list;
  return (
    <View style={styles.split}>
      <View style={[styles.pane, { borderRightColor: theme.colors.border }]}>{list}</View>
      <View style={styles.pane}>
        {selected ? <ReportDetail key={selected.id} report={selected} onOpenTarget={onOpenTarget} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  split: { flex: 1, flexDirection: 'row' },
  pane: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth },
});
