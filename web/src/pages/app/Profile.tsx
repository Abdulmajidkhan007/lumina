import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUser, isFollowing, setFollowing } from '../../lib/users';
import { fetchUserPosts } from '../../lib/posts';
import type { Post, UserProfile } from '../../types/models';
import { Avatar } from '../../components/Avatar';
import { EmptyState, ErrorState } from '../../components/StateViews';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { firebaseUser } = useAuth();
  const targetId = id ?? firebaseUser?.uid ?? '';
  const isMe = targetId === firebaseUser?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowingState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    setError('');
    try {
      const [p, ps, f] = await Promise.all([
        fetchUser(targetId),
        fetchUserPosts(targetId),
        isMe ? Promise.resolve(false) : isFollowing(targetId),
      ]);
      if (!p) {
        setError('User not found.');
        return;
      }
      setProfile(p);
      setPosts(ps);
      setFollowingState(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [targetId, isMe]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowingState(next);
    try {
      await setFollowing(targetId, next);
    } catch {
      setFollowingState(!next);
    }
  };

  if (loading) return <p className="px-4 py-10 text-center text-sm text-text-muted">Loading…</p>;
  if (error || !profile) return <ErrorState message={error || 'Not found'} onRetry={() => void load()} />;

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <header className="mb-6 flex items-center gap-5">
        <Avatar name={profile.displayName} avatarUrl={profile.avatarUrl} size="lg" />
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <h1 className="text-lg font-bold">{profile.username}</h1>
            {!isMe ? (
              <button
                type="button"
                onClick={() => void toggleFollow()}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  following ? 'border border-border bg-surface' : 'bg-gradient-brand text-white'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
          <div className="flex gap-6">
            <Stat value={profile.postCount} label="posts" />
            <Stat value={profile.followerCount} label="followers" />
            <Stat value={profile.followingCount} label="following" />
          </div>
        </div>
      </header>

      <div className="mb-6">
        <p className="text-sm font-semibold">{profile.displayName}</p>
        {profile.bio ? <p className="whitespace-pre-line text-sm">{profile.bio}</p> : null}
      </div>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description={isMe ? 'Share your first post.' : ''} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => {
            const m = post.media[0];
            const uri = m ? (m.type === 'video' ? m.thumbnailUri ?? m.uri : m.uri) : null;
            return (
              <Link key={post.id} to={`/app/p/${post.id}`} className="block aspect-square overflow-hidden bg-surface">
                {uri ? <img src={uri} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
