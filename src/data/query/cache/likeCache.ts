/**
 * Like state — one source of truth across every cached list.
 *
 * A post can appear in many query caches at once (feed, a profile grid,
 * saved, hashtag, post detail) and, when it is a single-video post, also in
 * the Reels tab as `reels/{postId}`. Liking it anywhere patches every copy,
 * keyed by the post id (a reel matches by `postId ?? id`). The patch is
 * idempotent: an item already in the target state is left untouched, so the
 * like count never drifts by applying it twice.
 */
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import type { Paginated } from '@/types/api';

/** First query-key segments whose data can hold posts or reels. */
export const LIKE_BEARING_ROOTS: ReadonlySet<string> = new Set([
  'feed',
  'post',
  'savedPosts',
  'archivedPosts',
  'explore',
  'hashtag',
  'reels',
]);

export function isLikeBearingQuery(queryKey: QueryKey): boolean {
  const root = queryKey[0];
  return typeof root === 'string' && LIKE_BEARING_ROOTS.has(root);
}

/** The structural slice of Post/Reel that carries like state. */
export type Likeable = { id: string; isLikedByMe: boolean; likeCount: number; postId?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLikeable(value: unknown): value is Likeable {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.isLikedByMe === 'boolean' &&
    typeof value.likeCount === 'number'
  );
}

/** The id likes are stored under: a reel twin uses its post's id. */
export function likeTargetId(item: Likeable): string {
  return typeof item.postId === 'string' ? item.postId : item.id;
}

/** Returns the item with the like applied, or the same reference if unaffected. */
export function applyLike<T extends Likeable>(item: T, targetId: string, liked: boolean): T {
  if (likeTargetId(item) !== targetId || item.isLikedByMe === liked) return item;
  return {
    ...item,
    isLikedByMe: liked,
    likeCount: Math.max(0, item.likeCount + (liked ? 1 : -1)),
  };
}

function isInfinitePaginated(value: unknown): value is InfiniteData<Paginated<unknown>> {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    value.pages.every((page) => isRecord(page) && Array.isArray(page.items))
  );
}

function patchItems(items: unknown[], targetId: string, liked: boolean): unknown[] {
  let changed = false;
  const next = items.map((item) => {
    if (!isLikeable(item)) return item;
    const patched = applyLike(item, targetId, liked);
    if (patched !== item) changed = true;
    return patched;
  });
  return changed ? next : items;
}

/**
 * Patches whatever shape a cache entry has — a single Post/Reel, an array,
 * or infinite pages of Paginated items. Unknown shapes are returned as-is.
 */
export function patchLikeInCacheData<T>(data: T, targetId: string, liked: boolean): T {
  if (data === undefined || data === null) return data;
  if (isLikeable(data)) return applyLike(data, targetId, liked) as T;
  if (Array.isArray(data)) return patchItems(data, targetId, liked) as T;
  if (isInfinitePaginated(data)) {
    let changed = false;
    const pages = data.pages.map((page) => {
      const items = patchItems(page.items, targetId, liked);
      if (items === page.items) return page;
      changed = true;
      return { ...page, items };
    });
    return (changed ? { ...data, pages } : data) as T;
  }
  return data;
}

