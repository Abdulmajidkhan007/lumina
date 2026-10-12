import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReels, setReelLiked, type Reel } from '../../lib/content';
import { toggleLike, useLikeState } from '../../lib/likeStore';
import { Avatar } from '../../components/Avatar';
import { SmartVideo } from '../../components/SmartVideo';
import { EmptyState } from '../../components/StateViews';
import { useI18n } from '../../i18n';

function ReelCard({ reel }: { reel: Reel }) {
  const { t } = useI18n();
  // A post twin shares the post's like entry (same key as the feed).
  const likeKey = reel.postId ?? `reel:${reel.id}`;
  const seed = useMemo(() => ({ liked: reel.isLikedByMe, count: reel.likeCount }), [reel.isLikedByMe, reel.likeCount]);
  const like = useLikeState(likeKey, seed);
  const persist = reel.postId ? undefined : (liked: boolean) => setReelLiked(reel.id, liked);
  const onLike = (force?: boolean) => toggleLike(likeKey, seed, force, persist);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <SmartVideo
        src={reel.video.uri}
        poster={reel.video.thumbnailUri}
        className="aspect-[9/16] w-full"
        holdToSpeedUp
        onDoubleTap={() => onLike(true)}
      />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-3">
          <Link to={`/app/u/${reel.author.id}`} className="flex min-w-0 items-center gap-2">
            <Avatar name={reel.author.displayName} avatarUrl={reel.author.avatarUrl} size="sm" />
            <span className="truncate text-sm font-semibold">{reel.author.username}</span>
          </Link>
          <button
            type="button"
            onClick={() => onLike()}
            aria-pressed={like.liked}
            aria-label={like.liked ? t('Unlike') : t('Like')}
            className={`ml-auto text-xl transition active:scale-90 ${like.liked ? 'text-red-500' : 'text-text'}`}
          >
            {like.liked ? '♥' : '♡'}
          </button>
        </div>
        {reel.caption ? <p className="text-sm">{reel.caption}</p> : null}
        <p className="text-xs text-text-muted">
          {t('{count} likes', { count: like.count.toLocaleString() })} ·{' '}
          {reel.postId ? (
            <Link to={`/app/p/${reel.postId}`}>{t('{count} comments', { count: reel.commentCount.toLocaleString() })}</Link>
          ) : (
            t('{count} comments', { count: reel.commentCount.toLocaleString() })
          )}
          {reel.audioTitle ? ` · ♪ ${reel.audioTitle}` : ''}
        </p>
      </div>
    </article>
  );
}

export function Reels() {
  const { t } = useI18n();
  const [reels, setReels] = useState<Reel[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setReels(null);
    void fetchReels()
      .then(setReels)
      .catch(() => setError(true));
  };

  useEffect(load, []);

  if (error) {
    return (
      <div className="px-4 py-10 text-center text-sm text-text-muted">
        {t("Couldn't load reels.")}{' '}
        <button type="button" className="underline" onClick={load}>
          {t('Retry')}
        </button>
      </div>
    );
  }
  if (reels === null) return <p className="px-4 py-10 text-center text-sm text-text-muted">{t('Loading…')}</p>;
  if (reels.length === 0) {
    return <EmptyState title={t('No reels yet')} description={t('Short videos will appear here. Post a video from Create to start.')} />;
  }

  return (
    <div className="mx-auto w-full max-w-[470px] space-y-6 px-4">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
