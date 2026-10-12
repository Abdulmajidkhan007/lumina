import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addReportNote,
  banReportedUser,
  fetchReportTrail,
  fetchReports,
  hideReportedPost,
  resolveReportedUserId,
  setReportStatus,
  type Report,
  type TrailEntry,
} from '../../lib/reports';
import { isClosed, nextStatuses, REPORT_STATUSES, type ReportStatus } from '../../lib/admin/reportStatus';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, LoadingState, TableRowSkeleton } from '../../components/StateViews';
import { PageHeader, buttonClass, inputClass } from '../../components/admin/PageHeader';
import { Segmented } from '../../components/admin/Segmented';
import { StatusBadge, type BadgeTone } from '../../components/admin/StatusBadge';
import { useI18n, type TFunction } from '../../i18n';

type Filter = 'active' | ReportStatus | 'all';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  open: 'warn',
  reviewing: 'info',
  resolved: 'ok',
  dismissed: 'neutral',
};

function statusLabel(t: TFunction, status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    open: t('open'),
    reviewing: t('reviewing'),
    resolved: t('resolved'),
    dismissed: t('dismissed'),
  };
  return labels[status];
}

function targetHref(r: Report): string | null {
  if (r.targetType === 'user') return `/app/u/${r.targetId}`;
  if (r.targetType === 'post') return `/app/p/${r.targetId}`;
  return null;
}

export function Reports() {
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    setReports(null);
    try {
      setReports(await fetchReports());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load reports.'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { active: 0, all: 0, open: 0, reviewing: 0, resolved: 0, dismissed: 0 };
    for (const r of reports ?? []) {
      c[r.status] += 1;
      c.all += 1;
      if (!isClosed(r.status)) c.active += 1;
    }
    return c;
  }, [reports]);

  const visible = useMemo(
    () =>
      (reports ?? []).filter((r) =>
        filter === 'all' ? true : filter === 'active' ? !isClosed(r.status) : r.status === filter,
      ),
    [reports, filter],
  );

  const selected = reports?.find((r) => r.id === selectedId) ?? null;

  const onChanged = (updated: Report) =>
    setReports((list) => list?.map((r) => (r.id === updated.id ? updated : r)) ?? list);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const filterOptions: { value: Filter; label: string }[] = [
    { value: 'active', label: `${t('Needs action')} (${counts.active})` },
    ...REPORT_STATUSES.map((s) => ({ value: s, label: `${statusLabel(t, s)} (${counts[s]})` })),
    { value: 'all', label: `${t('All')} (${counts.all})` },
  ];

  return (
    <div>
      <PageHeader
        title={t('Reports')}
        description={t('Complaints users file with "Report" on a post, profile or comment in the app. Contact form messages are under Messages.')}
        onRefresh={() => void load()}
      />
      <div className="mb-4">
        <Segmented<Filter> label={t('Filter by status')} value={filter} options={filterOptions} onChange={setFilter} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className={`rounded-2xl border border-border bg-surface ${selected ? 'hidden lg:block' : ''}`}>
          {reports === null ? (
            <table className="w-full">
              <tbody>
                <TableRowSkeleton columns={3} />
                <TableRowSkeleton columns={3} />
              </tbody>
            </table>
          ) : visible.length === 0 ? (
            <EmptyState title={t('No reports')} description={t('Reported content will appear here.')} />
          ) : (
            <ul>
              {visible.map((r) => (
                <li key={r.id} className="border-b border-border/60 last:border-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    aria-current={r.id === selectedId}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-text/5 ${
                      r.id === selectedId ? 'bg-text/5' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {t(r.targetType)} · <span className="text-text-muted">{r.reason || '—'}</span>
                      </span>
                      <span className="block truncate text-xs text-text-faint">
                        {formatRelativeTime(r.createdAt)} · {r.targetId}
                      </span>
                    </span>
                    <StatusBadge tone={STATUS_TONE[r.status]} label={statusLabel(t, r.status)} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <ReportDetail key={selected.id} report={selected} onChanged={onChanged} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted lg:block">
            {t('Select a report to review it.')}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReportDetailProps {
  report: Report;
  onChanged: (report: Report) => void;
  onBack: () => void;
}

function ReportDetail({ report, onChanged, onBack }: ReportDetailProps) {
  const { t } = useI18n();
  const noteId = useId();
  const [trail, setTrail] = useState<TrailEntry[] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadTrail = useCallback(async () => {
    try {
      setTrail(await fetchReportTrail(report.id));
    } catch {
      setTrail([]);
    }
  }, [report.id]);

  useEffect(() => {
    void loadTrail();
  }, [loadTrail]);

  const act = async (action: () => Promise<Report | null>) => {
    setBusy(true);
    setError('');
    try {
      const updated = await action();
      if (updated) onChanged(updated);
      setNote('');
      await loadTrail();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  const move = (to: ReportStatus) =>
    act(async () => {
      await setReportStatus(report, to, note);
      return { ...report, status: to, updatedAt: new Date().toISOString() };
    });

  const hidePost = () =>
    act(async () => {
      await hideReportedPost(report, note);
      return null;
    });

  const blockUser = () =>
    act(async () => {
      const uid = await resolveReportedUserId(report);
      if (!uid) throw new Error(t('Could not find the reported account.'));
      await banReportedUser(report, uid, note);
      return null;
    });

  const addNote = () =>
    act(async () => {
      await addReportNote(report.id, note);
      return null;
    });

  const href = targetHref(report);
  const actionLabel: Record<TrailEntry['action'], string> = {
    status: t('Status changed'),
    note: t('Note'),
    hide_post: t('Post hidden'),
    ban_user: t('User blocked'),
    legacy: t('Decision'),
  };

  return (
    <section aria-label={t('Report details')} className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <button type="button" onClick={onBack} className={`${buttonClass('secondary', 'sm')} mb-3 lg:hidden`}>
        ← {t('Back to list')}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">
            {t(report.targetType)}{' '}
            {href ? (
              <Link to={href} className="text-sm font-semibold text-brand-magenta hover:underline">
                {t('Open')} ↗
              </Link>
            ) : null}
          </h2>
          <p className="truncate text-xs text-text-faint">{report.targetId}</p>
        </div>
        <StatusBadge tone={STATUS_TONE[report.status]} label={statusLabel(t, report.status)} />
      </div>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        <dt className="text-text-muted">{t('Reason')}</dt>
        <dd>{report.reason || '—'}</dd>
        <dt className="text-text-muted">{t('Filed')}</dt>
        <dd>{new Date(report.createdAt).toLocaleString()}</dd>
        <dt className="text-text-muted">{t('Reporter')}</dt>
        <dd className="truncate">
          <Link to={`/app/u/${report.reporterId}`} className="hover:underline">
            {report.reporterId || '—'}
          </Link>
        </dd>
      </dl>

      <label htmlFor={noteId} className="mt-4 block text-sm font-semibold">
        {t('Note (optional)')}
      </label>
      <textarea
        id={noteId}
        value={note}
        maxLength={1000}
        rows={2}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('Why? Saved with the next step in the audit trail.')}
        className={`${inputClass} mt-1`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {nextStatuses(report.status).map((to) => (
          <button
            key={to}
            type="button"
            disabled={busy}
            onClick={() => void move(to)}
            className={buttonClass(to === 'resolved' ? 'primary' : 'secondary', 'sm')}
          >
            {to === 'reviewing' && isClosed(report.status) ? t('Reopen') : t('Mark {status}', { status: statusLabel(t, to) })}
          </button>
        ))}
        <button type="button" disabled={busy || note.trim().length === 0} onClick={() => void addNote()} className={buttonClass('secondary', 'sm')}>
          {t('Add note')}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {report.targetType === 'post' ? (
          <button type="button" disabled={busy} onClick={() => void hidePost()} className={buttonClass('danger', 'sm')}>
            {t('Hide post')}
          </button>
        ) : null}
        {report.targetType !== 'comment' ? (
          <button type="button" disabled={busy} onClick={() => void blockUser()} className={buttonClass('danger', 'sm')}>
            {report.targetType === 'post' ? t('Block author') : t('Block user')}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold">{t('Audit trail')}</h3>
      {trail === null ? (
        <LoadingState />
      ) : trail.length === 0 ? (
        <p className="mt-1 text-sm text-text-muted">{t('No actions yet.')}</p>
      ) : (
        <ol className="mt-2 space-y-2 border-l border-border pl-4">
          {trail.map((e) => (
            <li key={e.id} className="text-sm">
              <p>
                <span className="font-semibold">{actionLabel[e.action]}</span>
                {e.status ? <span className="text-text-muted"> → {statusLabel(t, e.status)}</span> : null}
              </p>
              {e.note ? <p className="text-text-muted">“{e.note}”</p> : null}
              <p className="text-xs text-text-faint">
                {e.moderatorEmail ?? e.moderatorId} · {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
