import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost, fetchComments, addComment, setPostLiked, setPostSaved } from '../../lib/posts';
import type { Comment, Post } from '../../types/models';
import { Avatar } from '../../components/Avatar';
import { ErrorState } from '../../components/StateViews';
import { formatRelativeTime } from '../../lib/time';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [p, c] = await Promise.all([fetchPost(id), fetchComments(id)]);
      if (!p) {
        setError('Post not found.');
        return;
      }
      setPost(p);
      setComments(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = async () => {
    if (!post) return;
    const next = !post.isLikedByMe;
    setPost({ ...post, isLikedByMe: next, likeCount: post.likeCount + (next ? 1 : -1) });
    try {
      await setPostLiked(post.id, next);
    } catch {
      setPost({ ...post, isLikedByMe: !next, likeCount: post.likeCount });
    }
  };

  const toggleSave = async () => {
    if (!post) return;
    const next = !post.isSavedByMe;
    setPost({ ...post, isSavedByMe: next });
    try {
      await setPostSaved(post.id, next);
    } catch {
      setPost({ ...post, isSavedByMe: !next });
    }
  };

  const submitComment = async () => {
    if (!post || text.trim().length === 0) return;
    const body = text.trim();
    setText('');
    await addComment(post.id, body);
    await load();
  };

  if (loading) return <p className="px-4 py-10 text-center text-sm text-text-muted">Loading…</p>;
  if (error || !post) return <ErrorState message={error || 'Not found'} onRetry={() => void load()} />;

  const media = post.media[index] ?? post.media[0];
  const uri = media.type === 'video' ? media.thumbnailUri ?? media.uri : media.uri;

  return (
    <div className="mx-auto w-full max-w-4xl gap-6 px-4 md:grid md:grid-cols-2">
      <div className="relative">
        {media.type === 'video' ? (
          <video src={media.uri} controls playsInline className="aspect-square w-full rounded-2xl bg-black object-contain" />
        ) : (
          <img src={uri} alt={post.caption ?? ''} className="aspect-square w-full rounded-2xl object-cover" />
        )}
        {post.media.length > 1 ? (
          <div className="mt-2 flex justify-center gap-2">
            {post.media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-brand-magenta' : 'bg-border'}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 md:mt-0">
        <Link to={`/app/u/${post.author.id}`} className="mb-3 flex items-center gap-3">
          <Avatar name={post.author.displayName} avatarUrl={post.author.avatarUrl} size="sm" />
          <span className="text-sm font-semibold">{post.author.username}</span>
        </Link>

        <div className="mb-3 flex items-center gap-4">
          <button type="button" onClick={() => void toggleLike()} className="text-sm font-semibold">
            {post.isLikedByMe ? '♥' : '♡'} {post.likeCount.toLocaleString()}
          </button>
          <button type="button" onClick={() => void toggleSave()} className="text-sm font-semibold text-text-muted">
            {post.isSavedByMe ? 'Saved' : 'Save'}
          </button>
          <span className="text-xs text-text-muted">{formatRelativeTime(post.createdAt)}</span>
        </div>

        {post.caption ? (
          <p className="mb-4 text-sm">
            <span className="font-semibold">{post.author.username}</span> {post.caption}
          </p>
        ) : null}

        <div className="space-y-3 border-t border-border pt-3">
          {comments.length === 0 ? (
            <p className="text-sm text-text-muted">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <Avatar name={c.author.displayName} avatarUrl={c.author.avatarUrl} size="sm" />
                <p>
                  <span className="font-semibold">{c.author.username}</span> {c.text}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-magenta"
          />
          <button
            type="button"
            onClick={() => void submitComment()}
            disabled={text.trim().length === 0}
            className="rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
