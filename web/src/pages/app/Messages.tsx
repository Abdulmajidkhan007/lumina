import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchConversations, getOrCreateConversation, type Conversation } from '../../lib/messages';
import { fetchSuggestedUsers } from '../../lib/users';
import type { UserSummary } from '../../types/models';
import { Avatar } from '../../components/Avatar';
import { formatRelativeTime } from '../../lib/time';

export function Messages() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [suggested, setSuggested] = useState<UserSummary[]>([]);

  useEffect(() => {
    void fetchConversations().then(setConversations).catch(() => setConversations([]));
    void fetchSuggestedUsers().then(setSuggested).catch(() => setSuggested([]));
  }, []);

  const openWith = async (userId: string) => {
    const id = await getOrCreateConversation(userId);
    navigate(`/app/messages/${id}`);
  };

  const other = (c: Conversation) =>
    c.participants.find((p) => p.id !== firebaseUser?.uid) ?? c.participants[0];

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <h1 className="mb-4 text-lg font-bold">Messages</h1>
      {conversations === null ? (
        <p className="px-3 py-6 text-sm text-text-muted">Loading…</p>
      ) : conversations.length === 0 ? (
        <>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Suggested</p>
          <div className="space-y-1">
            {suggested.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => void openWith(u.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5"
              >
                <Avatar name={u.displayName} avatarUrl={u.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.username}</p>
                </div>
                <span className="text-xs font-semibold text-brand-magenta">Message</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-1">
          {conversations.map((c) => {
            const o = other(c);
            return (
              <Link
                key={c.id}
                to={`/app/messages/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
              >
                <Avatar name={o?.displayName ?? ''} avatarUrl={o?.avatarUrl ?? null} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o?.username}</p>
                  <p className="truncate text-xs text-text-muted">{c.lastMessage?.text ?? 'Start chatting'}</p>
                </div>
                {c.updatedAt ? (
                  <time className="shrink-0 text-xs text-text-muted">{formatRelativeTime(c.updatedAt)}</time>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
