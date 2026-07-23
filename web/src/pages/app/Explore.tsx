import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers, fetchSuggestedUsers } from '../../lib/users';
import type { UserSummary } from '../../types/models';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/StateViews';

function UserRow({ user }: { user: UserSummary }) {
  return (
    <Link
      to={`/app/u/${user.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
    >
      <Avatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-xs text-text-muted">{user.displayName}</p>
      </div>
    </Link>
  );
}

export function Explore() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [suggested, setSuggested] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchSuggestedUsers().then(setSuggested).catch(() => setSuggested([]));
  }, []);

  useEffect(() => {
    const q = term.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void searchUsers(q)
        .then((r) => {
          if (active) setResults(r);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  const showing = term.trim().length > 0 ? results : suggested;

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search people"
        className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-magenta"
      />
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {term.trim().length > 0 ? 'Results' : 'Suggested'}
      </p>
      {loading ? (
        <p className="px-3 py-6 text-sm text-text-muted">Searching…</p>
      ) : showing.length === 0 ? (
        <EmptyState title="No people found" description="Try a different name." />
      ) : (
        <div className="space-y-1">
          {showing.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
