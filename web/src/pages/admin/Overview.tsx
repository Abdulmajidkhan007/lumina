import { useCallback, useEffect, useState } from 'react';
import { fetchOverviewStats, type OverviewStats } from '../../lib/admin';
import { ErrorState, StatCardSkeleton } from '../../components/StateViews';
import { useI18n } from '../../i18n';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value.toLocaleString()}</p>
    </div>
  );
}

export function Overview() {
  const { t } = useI18n();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setStats(null);
    try {
      setStats(await fetchOverviewStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load stats.'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{t('Overview')}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard label={t('Total users')} value={stats.totalUsers} />
            <StatCard label={t('Total posts')} value={stats.totalPosts} />
            <StatCard label={t('Activity today')} value={stats.activityToday} />
            <StatCard label={t('New messages')} value={stats.newMessages} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
