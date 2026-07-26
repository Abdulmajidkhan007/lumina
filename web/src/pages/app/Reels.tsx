import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReels, type Reel } from '../../lib/content';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/StateViews';

export function Reels() {
  const [reels, setReels] = useState<Reel[] | null>(null);

  useEffect(() => {
    void fetchReels().then(setReels).catch(() => setReels([]));
  }, []);

  if (reels === null) return <p className="px-4 py-10 text-center text-sm text-text-muted">Loading…</p>;
  if (reels.length === 0) {
    return <EmptyState title="No reels yet" description="Short videos will appear here." />;
  }

  return (
    <div className="mx-auto w-full max-w-[470px] space-y-6 px-4">
      {reels.map((reel) => (
        <article key={reel.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <video
            src={reel.video.uri}
            poster={reel.video.thumbnailUri}
            controls
            playsInline
            loop
            className="aspect-[9/16] w-full bg-black object-contain"
          />
          <div className="space-y-2 p-4">
            <Link to={`/app/u/${reel.author.id}`} className="flex items-center gap-2">
              <Avatar name={reel.author.displayName} avatarUrl={reel.author.avatarUrl} size="sm" />
              <span className="text-sm font-semibold">{reel.author.username}</span>
            </Link>
            {reel.caption ? <p className="text-sm">{reel.caption}</p> : null}
            <p className="text-xs text-text-muted">
              {reel.likeCount.toLocaleString()} likes · {reel.commentCount.toLocaleString()} comments
              {reel.audioTitle ? ` · ♪ ${reel.audioTitle}` : ''}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
