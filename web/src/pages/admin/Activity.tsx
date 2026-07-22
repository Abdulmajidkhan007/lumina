import { useCallback, useEffect, useState } from 'react';
import { fetchRecentActivity } from '../../lib/activity';
import type { ActivityLog, ActivityType } from '../../types/models';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, TableRowSkeleton } from '../../components/StateViews';

const BADGE: Record<ActivityType, string> = {
  signup: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  login: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  google_login: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  logout: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  password_reset: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  password_change: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  account_delete: 'bg-red-500/15 text-red-400 border-red-500/30',
  account_deactivate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  post_create: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  story_create: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  follow: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  unfollow: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  block: 'bg-red-500/15 text-red-400 border-red-500/30',
  report: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  professional_switch: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

const FALLBACK_BADGE = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';

function TypeBadge({ type }: { type: ActivityType }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        BADGE[type] ?? FALLBACK_BADGE
      }`}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export function Activity() {
  const [logs, setLogs] = useState<ActivityLog[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLogs(null);
    try {
      setLogs(await fetchRecentActivity());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Activity</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Platform</th>
            </tr>
          </thead>
          <tbody>
            {logs === null ? (
              <>
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10">
                  <EmptyState
                    title="No activity yet"
                    description="Sign-ups, logins and other auth events will appear here."
                  />
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {formatRelativeTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={log.type} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3">
                    {log.email ?? log.uid ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{log.platform}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
