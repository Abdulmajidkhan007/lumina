import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { summarize } from '@/utils/admin';
import { useAdminOverview } from '../hooks/useAdminData';
import { ChipRow, StatTile } from './AdminPrimitives';
import { MiniBarChart } from './MiniBarChart';
import { TabError, TabLoading, formatDayLabel } from './shared';

type Range = '14' | '30';

export function OverviewTab(): React.JSX.Element {
  const theme = useTheme();
  const { t, i18n } = useTranslation('admin');
  const [range, setRange] = useState<Range>('14');
  const days = Number(range);
  const { data, error, isLoading, isRefetching, refetch } = useAdminOverview(days);

  const derived = useMemo(() => {
    if (!data) return null;
    const label = (day: string) => formatDayLabel(day, i18n.language);
    return {
      active: data.series.map((p) => ({ label: label(p.day), value: p.activeUsers })),
      users: data.series.map((p) => ({ label: label(p.day), value: p.newUsers })),
      posts: data.series.map((p) => ({ label: label(p.day), value: p.posts })),
      dau: summarize(data.series.map((p) => p.activeUsers)),
      newUsers: summarize(data.series.map((p) => p.newUsers)).total,
      newPosts: summarize(data.series.map((p) => p.posts)).total,
      today: data.series.at(-1)?.activeUsers ?? 0,
    };
  }, [data, i18n.language]);

  if (isLoading) return <TabLoading />;
  if (error || !data || !derived) return <TabError error={error} onRetry={() => void refetch()} />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      contentContainerStyle={{ paddingBottom: theme.spacing['3xl'] }}
    >
      <ChipRow<Range>
        accessibilityLabel={t('overview.range', { n: days })}
        value={range}
        onChange={setRange}
        options={[
          { value: '14', label: t('overview.range', { n: 14 }) },
          { value: '30', label: t('overview.range', { n: 30 }) },
        ]}
      />
      <View style={[styles.wrap, { gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg }]}>
        <StatTile label={t('overview.activeToday')} value={derived.today} hint={t('overview.avgPerDay', { n: Math.round(derived.dau.average) })} />
        <StatTile label={t('overview.totalUsers')} value={data.totals.totalUsers} hint={t('overview.plusInDays', { n: derived.newUsers, d: days })} />
        <StatTile label={t('overview.totalPosts')} value={data.totals.totalPosts} hint={t('overview.plusInDays', { n: derived.newPosts, d: days })} />
        <StatTile label={t('overview.openReports')} value={data.totals.openReports} />
      </View>
      <View style={[styles.wrap, { gap: theme.spacing.md, padding: theme.spacing.lg }]}>
        <MiniBarChart title={t('overview.dailyActive')} points={derived.active} />
        <MiniBarChart title={t('overview.newUsersPerDay')} points={derived.users} />
        <MiniBarChart title={t('overview.postsPerDay')} points={derived.posts} />
      </View>
      <Text variant="caption" color="tertiary" style={{ paddingHorizontal: theme.spacing.lg }}>
        {t('overview.utcNote')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
