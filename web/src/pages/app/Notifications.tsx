import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAllNotificationsRead, type AppNotification } from '../../lib/content';
import { fetchBroadcastReadAt, fetchBroadcastsSince, markBroadcastsRead, type Broadcast } from '../../lib/broadcasts';
import { isBroadcastUnread, mergeNewestFirst } from '../../lib/broadcastUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/StateViews';
import { formatRelativeTime } from '../../lib/time';
import { useI18n } from '../../i18n';

const VERB: Record<AppNotification['type'], string> = {
  like: 'liked your post',
  comment: 'commented',
  follow: 'started following you',
  mention: 'mentioned you',
};

type BroadcastEntry = Broadcast & { kind: 'broadcast'; read: boolean };
type NotificationEntry = AppNotification & { kind: 'notification' };

export function Notifications() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const joinedAt = profile?.createdAt ?? null;
  const [items, setItems] = useState<(NotificationEntry | BroadcastEntry)[] | null>(null);

  const load = useCallback(async () => {
    const [notifications, broadcasts] = await Promise.all([
      fetchNotifications().catch(() => []),
      // Announcements are optional extras: a failure must not hide notifications.
      joinedAt
        ? Promise.all([fetchBroadcastsSince(joinedAt), fetchBroadcastReadAt()]).catch(
            () => [[], null] as [Broadcast[], null],
          )
        : Promise.resolve([[], null] as [Broadcast[], null]),
    ]);
    const [list, readAt] = broadcasts;
    setItems(
      mergeNewestFirst(
        notifications.map((n): NotificationEntry => ({ ...n, kind: 'notification' })),
        list.map((b): BroadcastEntry => ({
          ...b,
          kind: 'broadcast',
          read: !isBroadcastUnread(Date.parse(b.createdAt), readAt),
        })),
      ),
    );
  }, [joinedAt]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async () => {
    await Promise.allSettled([markAllNotificationsRead(), markBroadcastsRead()]);
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">{t('Notifications')}</h1>
        <button
          type="button"
          onClick={() => void markRead()}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
        >
          {t('Mark all read')}
        </button>
      </div>

      {items === null ? (
        <p className="px-3 py-6 text-sm text-text-muted">{t('Loading…')}</p>
      ) : items.length === 0 ? (
        <EmptyState title={t('No notifications')} description={t('Likes, comments and follows appear here.')} />
      ) : (
        <div className="space-y-1">
          {items.map((n) =>
            n.kind === 'broadcast' ? (
              <article
                key={`b-${n.id}`}
                className={`rounded-xl border border-brand-magenta/30 px-3 py-2.5 ${n.read ? '' : 'bg-brand-magenta/10'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-magenta">{t('Announcement')}</p>
                  <time className="shrink-0 text-xs text-text-muted">{formatRelativeTime(n.createdAt)}</time>
                </div>
                <p className="mt-0.5 text-sm font-semibold">{n.title}</p>
                <p className="whitespace-pre-line text-sm text-text-muted">{n.body}</p>
                {n.link ? (
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block max-w-full truncate text-sm font-semibold text-brand-magenta hover:underline"
                  >
                    {t('Open link')} ↗
                  </a>
                ) : null}
              </article>
            ) : (
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
                  {t(VERB[n.type])}
                  {n.commentText ? <span className="text-text-muted">: {n.commentText}</span> : null}
                </p>
                {n.postPreview ? (
                  <Link to={`/app/p/${n.postPreview.postId}`} className="shrink-0">
                    <img src={n.postPreview.thumbnailUri} alt="" className="h-10 w-10 rounded object-cover" />
                  </Link>
                ) : null}
                <time className="shrink-0 text-xs text-text-muted">{formatRelativeTime(n.createdAt)}</time>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
