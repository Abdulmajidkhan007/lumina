import { useCallback, useEffect, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { fetchFeedPage, setPostLiked } from '../../lib/posts';
import type { Post } from '../../types/models';
import { formatRelativeTime } from '../../lib/time';
import { Avatar } from '../../components/Avatar';
import { EmptyState, ErrorState, PostCardSkeleton } from '../../components/StateViews';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 transition ${filled ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const media = post.media[0];

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await setPostLiked(post.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const imageUri = media ? (media.type === 'video' ? media.thumbnailUri ?? media.uri : media.uri) : null;

  return (
    <article className="overflow-hidden border-border bg-surface sm:rounded-2xl sm:border">
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar name={post.author.displayName} avatarUrl={post.author.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{post.author.username}</p>
        </div>
        <time className="ml-auto shrink-0 text-xs text-text-muted">
          {formatRelativeTime(post.createdAt)}
        </time>
      </header>
      {imageUri ? (
        <img
          src={imageUri}
          alt={post.caption ?? `Post by ${post.author.username}`}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : null}
      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
            className="transition active:scale-90"
          >
            <HeartIcon filled={liked} />
          </button>
          <span className="text-sm font-semibold">{likeCount.toLocaleString()} likes</span>
        </div>
        {post.caption ? (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{post.author.username}</span> {post.caption}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await fetchFeedPage(null);
      setPosts(page.posts);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage(cursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[470px] space-y-6">
      {loading ? (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadFirst()} />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Posts from the Lumina community will appear here." />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mx-auto block rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
