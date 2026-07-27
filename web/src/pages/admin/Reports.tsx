import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReports, fetchResolvedReportIds, resolveReport, type Report } from '../../lib/reports';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, TableRowSkeleton } from '../../components/StateViews';

export function Reports() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    setReports(null);
    try {
      const list = await fetchReports();
      setReports(list);
      setResolved(await fetchResolvedReportIds(list.map((r) => r.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, outcome: 'dismissed' | 'actioned') => {
    setBusyId(id);
    try {
      await resolveReport(id, outcome);
      setResolved((prev) => new Set(prev).add(id));
    } finally {
      setBusyId(null);
    }
  };

  const targetHref = (r: Report) =>
    r.targetType === 'user' ? `/app/u/${r.targetId}` : `/app/p/${r.targetId}`;

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Reports</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports === null ? (
              <>
                <TableRowSkeleton columns={5} />
                <TableRowSkeleton columns={5} />
              </>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState title="No reports" description="Reported content will appear here." />
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const isResolved = resolved.has(r.id);
                return (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 text-text-muted">{formatRelativeTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={targetHref(r)} className="font-semibold text-brand-magenta">
                        {r.targetType}
                      </Link>
                      <span className="block truncate text-xs text-text-muted">{r.targetId}</span>
                    </td>
                    <td className="px-4 py-3">{r.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          isResolved
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                            : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {isResolved ? 'resolved' : 'open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isResolved ? (
                        <span className="text-xs text-text-muted">—</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => void decide(r.id, 'actioned')}
                            className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Action
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => void decide(r.id, 'dismissed')}
                            className="rounded-lg border border-border px-3 py-1 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
