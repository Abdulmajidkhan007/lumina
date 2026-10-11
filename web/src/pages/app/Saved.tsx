import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSavedPosts } from '../../lib/content';
import type { Post } from '../../types/models';
import { EmptyState } from '../../components/StateViews';
import { MediaImage } from '../../components/MediaImage';
import { useI18n } from '../../i18n';

export function Saved() {
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    void fetchSavedPosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  if (posts === null) return <p className="px-4 py-10 text-center text-sm text-text-muted">{t('Loading…')}</p>;

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <h1 className="mb-4 text-lg font-bold">{t('Saved')}</h1>
      {posts.length === 0 ? (
        <EmptyState title={t('Nothing saved yet')} description={t('Posts you save appear here.')} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => {
            const m = post.media[0];
            const uri = m ? (m.type === 'video' ? m.thumbnailUri ?? m.uri : m.uri) : null;
            return (
              <Link key={post.id} to={`/app/p/${post.id}`} className="block aspect-square overflow-hidden bg-surface">
                {uri ? <MediaImage src={uri} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
