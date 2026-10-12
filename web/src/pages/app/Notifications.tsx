import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAllNotificationsRead, type AppNotification } from '../../lib/content';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/StateViews';
import { formatRelativeTime } from '../../lib/time';
import { respondToCollab } from '../../lib/collab';
import { useI18n } from '../../i18n';

const VERB: Record<AppNotification['type'], string> = {
  like: 'liked your post',
  comment: 'commented',
  follow: 'started following you',
  mention: 'mentioned you',
  collab_invite: 'invited you to collaborate on a post',
};

/** Accept / Decline for a collab invite, or the recorded answer. */
function CollabActions({ n, onDone }: { n: AppNotification; onDone: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  if (n.response) {
    return (
      <p className="mt-1 text-xs text-text-muted">
        {n.response === 'accepted' ? t('Accepted — the post now shows on your profile.') : t('Declined')}
      </p>
    );
  }
  if (!n.postPreview) return null;
  const postId = n.postPreview.postId;
  const answer = async (accept: boolean) => {
    setBusy(accept);
    setError(false);
    try {
      await respondToCollab(postId, n.id, accept);
      onDone();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void answer(true)}
        className="rounded-lg bg-gradient-brand px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {busy === true ? '…' : t('Accept')}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void answer(false)}
        className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold disabled:opacity-60"
      >
        {busy === false ? '…' : t('Decline')}
      </button>
      {error ? <span className="text-xs text-red-400">{t("Couldn't answer the invite.")}</span> : null}
    </div>
  );
}

export function Notifications() {
  const { t } = useI18n();
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
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${n.read ? '' : 'bg-white/5'}`}
            >
              <Link to={`/app/u/${n.actor.id}`}>
                <Avatar name={n.actor.displayName} avatarUrl={n.actor.avatarUrl} size="sm" />
              </Link>
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <Link to={`/app/u/${n.actor.id}`} className="font-semibold">
                    {n.actor.username}
                  </Link>{' '}
                  {t(VERB[n.type])}
                  {n.commentText ? <span className="text-text-muted">: {n.commentText}</span> : null}
                </p>
                {n.type === 'collab_invite' ? <CollabActions n={n} onDone={() => void load()} /> : null}
              </div>
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
