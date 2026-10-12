/**
 * Session-wide like state keyed by post id — the web counterpart of the
 * app's shared like cache. The feed, post detail and Reels (a reel twin of a
 * post likes the post) read the same entry, so liking in one place shows
 * everywhere without a refetch. Optimistic, rolled back on failure.
 */
import { useSyncExternalStore } from 'react';
import { setPostLiked } from './posts';

export interface LikeState {
  liked: boolean;
  count: number;
}

const states = new Map<string, LikeState>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(postId: string, next: LikeState) {
  states.set(postId, next);
  emit();
}

/**
 * Flips the like (or forces a value — double-tap always likes) for `postId`,
 * optimistically, persisting through `persist` (default: the post's likes)
 * and rolling back on failure. Callable from anywhere.
 */
export function toggleLike(
  postId: string,
  seed: LikeState,
  force?: boolean,
  persist: (liked: boolean) => Promise<void> = (liked) => setPostLiked(postId, liked),
): void {
  const current = states.get(postId) ?? seed;
  const liked = force ?? !current.liked;
  if (liked === current.liked) return;
  write(postId, { liked, count: Math.max(0, current.count + (liked ? 1 : -1)) });
  persist(liked).catch(() => write(postId, current));
}

/** Current like state for `postId`, seeded from the server copy the caller has. */
export function useLikeState(postId: string, seed: LikeState): LikeState {
  return useSyncExternalStore(subscribe, () => states.get(postId)) ?? seed;
}
