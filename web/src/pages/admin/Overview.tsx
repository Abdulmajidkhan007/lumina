import { useCallback, useEffect, useState } from 'react';
import { fetchOverviewStats, type OverviewStats } from '../../lib/admin';
import { ErrorState, StatCardSkeleton } from '../../components/StateViews';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value.toLocaleString()}</p>
    </div>
  );
}

export function Overview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setStats(null);
    try {
      setStats(await fetchOverviewStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats ? (
          <>
            <StatCard label="Total users" value={stats.totalUsers} />
            <StatCard label="Total posts" value={stats.totalPosts} />
            <StatCard label="Activity today" value={stats.activityToday} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
