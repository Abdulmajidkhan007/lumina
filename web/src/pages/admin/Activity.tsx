import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRecentActivity } from '../../lib/activity';
import { ADMIN_ACTIONS, fetchAdminLogs } from '../../lib/admin/adminLog';
import { ACTIVITY_TYPES } from '../../types/models';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, TableRowSkeleton } from '../../components/StateViews';
import { PageHeader, inputClass } from '../../components/admin/PageHeader';
import { Segmented } from '../../components/admin/Segmented';
import { StatusBadge, type BadgeTone } from '../../components/admin/StatusBadge';
import { useI18n } from '../../i18n';

type Source = 'admin' | 'users';

/** One row, whichever journal it came from. */
interface JournalRow {
  id: string;
  type: string;
  who: string;
  detail: string;
  createdAt: string;
}

const TONE: Partial<Record<string, BadgeTone>> = {
  signup: 'ok',
  login: 'ok',
  google_login: 'ok',
  post_create: 'info',
  story_create: 'info',
  follow: 'info',
  password_reset: 'warn',
  password_change: 'warn',
  report: 'warn',
  account_deactivate: 'warn',
  account_delete: 'danger',
  block: 'danger',
  role_change: 'info',
  report_status: 'info',
  report_note: 'neutral',
  broadcast_send: 'ok',
  broadcast_delete: 'warn',
  unban_user: 'ok',
  ban_user: 'danger',
  hide_post: 'danger',
};

export function Activity() {
  const { t } = useI18n();
  const [source, setSource] = useState<Source>('admin');
  const [rows, setRows] = useState<JournalRow[] | null>(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setError('');
    setRows(null);
    try {
      if (source === 'admin') {
        const logs = await fetchAdminLogs();
        setRows(
          logs.map((l) => ({
            id: l.id,
            type: l.action,
            who: l.actorEmail ?? l.actorId,
            detail: [l.targetType && l.targetId ? `${l.targetType}: ${l.targetId}` : '', l.note ?? '']
              .filter(Boolean)
              .join(' — '),
            createdAt: l.createdAt,
          })),
        );
      } else {
        const logs = await fetchRecentActivity();
        setRows(
          logs.map((l) => ({
            id: l.id,
            type: l.type,
            who: l.email ?? l.uid ?? '—',
            detail: l.platform,
            createdAt: l.createdAt,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load activity.'));
    }
  }, [source, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const types: readonly string[] = source === 'admin' ? ADMIN_ACTIONS : ACTIVITY_TYPES;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (type === '' || r.type === type) &&
        (q === '' || r.who.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q)),
    );
  }, [rows, type, search]);

  const switchSource = (next: Source) => {
    setSource(next);
    setType('');
  };

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <PageHeader
        title={t('Activity')}
        description={t('Admin actions (roles, blocks, report decisions, announcements) and recent sign-in and social events.')}
        onRefresh={() => void load()}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Segmented<Source>
          label={t('Journal')}
          value={source}
          onChange={switchSource}
          options={[
            { value: 'admin', label: t('Admin actions') },
            { value: 'users', label: t('User events') },
          ]}
        />
        <select
          aria-label={t('Event type')}
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">{t('All types')}</option>
          {types.map((ty) => (
            <option key={ty} value={ty}>
              {ty.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Filter by email, id or note…')}
          aria-label={t('Filter by email, id or note')}
          className={`${inputClass} sm:w-64`}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">{t('Time')}</th>
              <th className="px-4 py-3">{t('Event')}</th>
              <th className="px-4 py-3">{t('Who')}</th>
              <th className="px-4 py-3">{source === 'admin' ? t('Details') : t('Platform')}</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <>
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10">
                  <div className="sticky left-0 max-w-[85vw]">
                    <EmptyState
                      title={t('No activity yet')}
                      description={
                        source === 'admin'
                          ? t('Role changes, blocks, report decisions and announcements will appear here.')
                          : t('Sign-ups, logins and other auth events will appear here.')
                      }
                    />
                  </div>
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted" title={new Date(r.createdAt).toLocaleString()}>
                    {formatRelativeTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={TONE[r.type] ?? 'neutral'} label={r.type.replace(/_/g, ' ')} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3">{r.who}</td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-text-muted" title={r.detail}>
                    {r.detail || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
