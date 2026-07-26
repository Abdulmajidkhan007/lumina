import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAllNotificationsRead, type AppNotification } from '../../lib/content';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/StateViews';
import { formatRelativeTime } from '../../lib/time';

const VERB: Record<AppNotification['type'], string> = {
  like: 'liked your post',
  comment: 'commented',
  follow: 'started following you',
  mention: 'mentioned you',
};

export function Notifications() {
  const [items, setItems] = useState<AppNotification[] | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchNotifications());
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async () => {
    await markAllNotificationsRead();
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Notifications</h1>
        <button
          type="button"
          onClick={() => void markRead()}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
        >
          Mark all read
        </button>
      </div>

      {items === null ? (
        <p className="px-3 py-6 text-sm text-text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No notifications" description="Likes, comments and follows appear here." />
      ) : (
        <div className="space-y-1">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${n.read ? '' : 'bg-white/5'}`}
            >
              <Link to={`/app/u/${n.actor.id}`}>
                <Avatar name={n.actor.displayName} avatarUrl={n.actor.avatarUrl} size="sm" />
              </Link>
              <p className="min-w-0 flex-1 text-sm">
                <Link to={`/app/u/${n.actor.id}`} className="font-semibold">
                  {n.actor.username}
                </Link>{' '}
                {VERB[n.type]}
                {n.commentText ? <span className="text-text-muted">: {n.commentText}</span> : null}
              </p>
              {n.postPreview ? (
                <Link to={`/app/p/${n.postPreview.postId}`} className="shrink-0">
                  <img src={n.postPreview.thumbnailUri} alt="" className="h-10 w-10 rounded object-cover" />
                </Link>
              ) : null}
              <time className="shrink-0 text-xs text-text-muted">{formatRelativeTime(n.createdAt)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
