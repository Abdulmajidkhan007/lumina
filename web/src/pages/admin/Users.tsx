import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEmails, searchUsers, type AdminUser } from '../../lib/admin';
import { fetchStaffRoles, setUserRole, USER_ROLES, type StaffRole, type UserRole } from '../../lib/admin/roles';
import { banUser, fetchBans, unbanUser, type UserBan } from '../../lib/admin/bans';
import { ADMIN_EMAIL } from '../../lib/constants';
import { formatDate, formatRelativeTime } from '../../lib/time';
import { Avatar } from '../../components/Avatar';
import { EmptyState, ErrorState, TableRowSkeleton } from '../../components/StateViews';
import { PageHeader, buttonClass, inputClass } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ReasonDialog } from '../../components/admin/ReasonDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useStaff } from '../../contexts/StaffContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n';

interface Directory {
  users: AdminUser[];
  roles: Map<string, StaffRole>;
  bans: Map<string, UserBan>;
  emails: Map<string, string>;
}

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-4';

export function Users() {
  const { t } = useI18n();
  const { firebaseUser } = useAuth();
  const { isAdmin } = useStaff();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search, 350);
  const [dir, setDir] = useState<Directory | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setError('');
    setDir(null);
    try {
      const [users, roles, bans] = await Promise.all([searchUsers(term), fetchStaffRoles(), fetchBans()]);
      const emails = await fetchEmails(users.map((u) => u.id)).catch(() => new Map<string, string>());
      setDir({ users, roles, bans, emails });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load users.'));
    }
  }, [term, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (uid: string, action: () => Promise<void>, apply: (d: Directory) => Directory) => {
    setBusyId(uid);
    setActionError('');
    try {
      await action();
      setDir((d) => (d ? apply(d) : d));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (user: AdminUser, role: UserRole) =>
    run(user.id, () => setUserRole(user.id, role), (d) => {
      const roles = new Map(d.roles);
      if (role === 'user') roles.delete(user.id);
      else roles.set(user.id, role);
      return { ...d, roles };
    });

  const unblock = (user: AdminUser) =>
    run(user.id, () => unbanUser(user.id), (d) => {
      const bans = new Map(d.bans);
      bans.delete(user.id);
      return { ...d, bans };
    });

  const roleLabel: Record<UserRole, string> = { user: t('User'), moderator: t('Moderator'), admin: t('Admin') };

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <PageHeader
        title={t('Users')}
        description={t('Search by username, name or sign-in email. Blocked users can still browse but cannot post, comment, like or message.')}
        onRefresh={() => void load()}
      />
      <input
        type="search"
        placeholder={t('Search users…')}
        aria-label={t('Search users')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputClass} mb-4 sm:max-w-sm`}
      />
      {actionError ? (
        <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface">
        <div className={`hidden border-b border-border px-4 py-3 text-xs uppercase tracking-wide text-text-muted ${ROW_GRID}`}>
          <span>{t('User')}</span>
          <span>{t('Role')}</span>
          <span>{t('Last active')}</span>
          <span className="text-right">{t('Actions')}</span>
        </div>
        {dir === null ? (
          <table className="w-full">
            <tbody>
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
            </tbody>
          </table>
        ) : dir.users.length === 0 ? (
          <EmptyState title={t('No users found')} />
        ) : (
          <ul>
            {dir.users.map((u) => {
              const email = dir.emails.get(u.id) ?? null;
              const role: UserRole = email === ADMIN_EMAIL ? 'admin' : dir.roles.get(u.id) ?? 'user';
              const ban = dir.bans.get(u.id);
              const isSelf = u.id === firebaseUser?.uid;
              const isOwner = email === ADMIN_EMAIL;
              const canEditRole = isAdmin && !isSelf && !isOwner;
              const canBlock = !isSelf && !isOwner && (isAdmin || role === 'user');
              const busy = busyId === u.id;
              return (
                <li key={u.id} className={`flex flex-col gap-3 border-b border-border/60 px-4 py-3 last:border-0 ${ROW_GRID}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.displayName} avatarUrl={u.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link to={`/app/u/${u.id}`} className="truncate font-semibold hover:underline">
                          @{u.username}
                        </Link>
                        {ban ? <StatusBadge tone="danger" label={t('Blocked')} /> : null}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {u.displayName}
                        {email ? ` · ${email}` : ''}
                      </p>
                      <p className="text-xs text-text-faint">
                        {t('Joined {date}', { date: formatDate(u.createdAt) })} · {t('{n} posts', { n: u.postCount })}
                      </p>
                      {ban?.reason ? <p className="truncate text-xs text-danger">{ban.reason}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-text-muted md:hidden">{t('Role')}:</span>
                    {canEditRole ? (
                      <select
                        aria-label={t('Role of @{username}', { username: u.username })}
                        value={role}
                        disabled={busy}
                        onChange={(e) => {
                          const next = USER_ROLES.find((r) => r === e.target.value);
                          if (next) void changeRole(u, next);
                        }}
                        className={`${inputClass} w-auto py-1.5`}
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge tone={role === 'user' ? 'neutral' : 'info'} label={roleLabel[role]} />
                    )}
                  </div>
                  <div className="text-sm text-text-muted">
                    <span className="text-xs md:hidden">{t('Last active')}: </span>
                    {u.lastActiveAt ? formatRelativeTime(u.lastActiveAt) : '—'}
                  </div>
                  <div className="flex md:justify-end">
                    {ban ? (
                      <button
                        type="button"
                        disabled={busy || !canBlock}
                        onClick={() => void unblock(u)}
                        className={buttonClass('secondary', 'sm')}
                      >
                        {t('Unblock')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || !canBlock}
                        onClick={() => setBanTarget(u)}
                        className={buttonClass('danger', 'sm')}
                      >
                        {t('Block')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ReasonDialog
        open={banTarget !== null}
        title={t('Block @{username}?', { username: banTarget?.username ?? '' })}
        description={t('They will keep read access but cannot post, comment, like, follow or message until unblocked.')}
        confirmLabel={t('Block')}
        onClose={() => setBanTarget(null)}
        onConfirm={async (reason) => {
          const target = banTarget;
          if (!target) return;
          await banUser(target.id, reason);
          setDir((d) => {
            if (!d) return d;
            const bans = new Map(d.bans);
            bans.set(target.id, { uid: target.id, reason, bannedBy: firebaseUser?.uid ?? '', createdAt: new Date().toISOString() });
            return { ...d, bans };
          });
        }}
      />
    </div>
  );
}
