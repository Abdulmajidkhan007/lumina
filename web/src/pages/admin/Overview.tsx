import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDailySeries, fetchOverviewTotals, type DailyPoint, type OverviewTotals } from '../../lib/admin/stats';
import { summarize } from '../../lib/admin/dayBuckets';
import { ErrorState, StatCardSkeleton } from '../../components/StateViews';
import { StatCard } from '../../components/admin/StatCard';
import { BarChart, type BarPoint } from '../../components/admin/BarChart';
import { Segmented } from '../../components/admin/Segmented';
import { PageHeader, buttonClass } from '../../components/admin/PageHeader';
import { useStaff } from '../../contexts/StaffContext';
import { intlLocale, useI18n } from '../../i18n';

type Range = '14' | '30';

interface OverviewData {
  totals: OverviewTotals;
  series: DailyPoint[];
}

export function Overview() {
  const { t, lang } = useI18n();
  const { isAdmin } = useStaff();
  const [range, setRange] = useState<Range>('14');
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [showTable, setShowTable] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setData(null);
    try {
      const [totals, series] = await Promise.all([fetchOverviewTotals(isAdmin), fetchDailySeries(Number(range))]);
      setData({ totals, series });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load stats.'));
    }
  }, [isAdmin, range, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayLabel = useMemo(() => {
    const format = new Intl.DateTimeFormat(intlLocale(lang), { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return (day: string) => format.format(new Date(`${day}T00:00:00Z`));
  }, [lang]);

  const charts = useMemo(() => {
    if (!data) return null;
    const toPoints = (pick: (p: DailyPoint) => number): BarPoint[] =>
      data.series.map((p) => ({ label: dayLabel(p.day), value: pick(p) }));
    return {
      active: toPoints((p) => p.activeUsers),
      users: toPoints((p) => p.newUsers),
      posts: toPoints((p) => p.posts),
      dau: summarize(data.series.map((p) => p.activeUsers)),
      newUsers: summarize(data.series.map((p) => p.newUsers)),
      newPosts: summarize(data.series.map((p) => p.posts)),
      today: data.series.at(-1)?.activeUsers ?? 0,
    };
  }, [data, dayLabel]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const days = Number(range);
  return (
    <div>
      <PageHeader
        title={t('Overview')}
        description={t('Days are in UTC. Active users are counted from the first app open of each day.')}
        onRefresh={() => void load()}
        actions={
          <Segmented<Range>
            label={t('Range')}
            value={range}
            onChange={setRange}
            options={[
              { value: '14', label: t('{n} days', { n: 14 }) },
              { value: '30', label: t('{n} days', { n: 30 }) },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {data && charts ? (
          <>
            <StatCard
              label={t('Active today')}
              value={charts.today}
              hint={t('avg {n}/day over {d} days', { n: Math.round(charts.dau.average), d: days })}
            />
            <StatCard
              label={t('Total users')}
              value={data.totals.totalUsers}
              hint={t('+{n} in {d} days', { n: charts.newUsers.total, d: days })}
            />
            <StatCard
              label={t('Total posts')}
              value={data.totals.totalPosts}
              hint={t('+{n} in {d} days', { n: charts.newPosts.total, d: days })}
            />
            <StatCard
              label={t('Open reports')}
              value={data.totals.openReports}
              hint={
                <Link to="/admin/reports" className="text-brand-magenta hover:underline">
                  {t('Review queue →')}
                </Link>
              }
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      {charts ? (
        <>
          <div className="mt-4 grid gap-3 sm:gap-4 xl:grid-cols-3">
            <BarChart title={t('Daily active users')} unit={t('users')} points={charts.active} />
            <BarChart title={t('New users per day')} unit={t('users')} points={charts.users} />
            <BarChart title={t('Posts per day')} unit={t('posts')} points={charts.posts} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {isAdmin && data && data.totals.newMessages > 0 ? (
              <Link to="/admin/messages" className="text-sm text-brand-magenta hover:underline">
                {t('{n} new contact messages', { n: data.totals.newMessages })}
              </Link>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => setShowTable((v) => !v)} className={buttonClass('secondary', 'sm')}>
              {showTable ? t('Hide table') : t('Show as table')}
            </button>
          </div>
          {showTable && data ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full min-w-[420px] text-left text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-2">{t('Day (UTC)')}</th>
                    <th className="px-4 py-2 text-right">{t('Active users')}</th>
                    <th className="px-4 py-2 text-right">{t('New users')}</th>
                    <th className="px-4 py-2 text-right">{t('Posts')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.series].reverse().map((p) => (
                    <tr key={p.day} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2">{p.day}</td>
                      <td className="px-4 py-2 text-right">{p.activeUsers}</td>
                      <td className="px-4 py-2 text-right">{p.newUsers}</td>
                      <td className="px-4 py-2 text-right">{p.posts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
