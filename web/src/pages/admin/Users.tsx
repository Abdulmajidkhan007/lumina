import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRecentUsers } from '../../lib/admin';
import type { UserProfile } from '../../types/models';
import { formatDate } from '../../lib/time';
import { Avatar } from '../../components/Avatar';
import { EmptyState, ErrorState, TableRowSkeleton } from '../../components/StateViews';

export function Users() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setError('');
    setUsers(null);
    try {
      setUsers(await fetchRecentUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q),
    );
  }, [users, search]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Users</h1>
        <input
          type="search"
          placeholder="Search users…"
          aria-label="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none transition focus:border-brand-magenta"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Followers</th>
              <th className="px-4 py-3 text-right">Posts</th>
            </tr>
          </thead>
          <tbody>
            {filtered === null ? (
              <>
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10">
                  <EmptyState title="No users found" />
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.displayName} avatarUrl={u.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">@{u.username}</p>
                        <p className="truncate text-xs text-text-muted">{u.displayName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{u.followerCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{u.postCount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
