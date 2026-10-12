import type { InfiniteData } from '@tanstack/react-query';
import type { Paginated } from '@/types/api';
import { applyLike, isLikeBearingQuery, patchLikeInCacheData } from '../likeCache';

type Item = { id: string; isLikedByMe: boolean; likeCount: number; postId?: string };

const post = (id: string, liked = false, count = 3): Item => ({ id, isLikedByMe: liked, likeCount: count });

function pages(...lists: Item[][]): InfiniteData<Paginated<Item>> {
  return {
    pages: lists.map((items) => ({ items, nextCursor: null })),
    pageParams: lists.map(() => undefined),
  };
}

describe('applyLike', () => {
  it('likes and unlikes with a count delta', () => {
    expect(applyLike(post('p1'), 'p1', true)).toEqual({ id: 'p1', isLikedByMe: true, likeCount: 4 });
    expect(applyLike(post('p1', true), 'p1', false)).toEqual({ id: 'p1', isLikedByMe: false, likeCount: 2 });
  });

  it('is idempotent — never double counts', () => {
    const liked = post('p1', true, 4);
    expect(applyLike(liked, 'p1', true)).toBe(liked);
  });

  it('never goes negative', () => {
    expect(applyLike(post('p1', true, 0), 'p1', false).likeCount).toBe(0);
  });

  it('matches a reel twin by its postId', () => {
    const reel: Item = { id: 'p1', postId: 'p1', isLikedByMe: false, likeCount: 1 };
    expect(applyLike(reel, 'p1', true).isLikedByMe).toBe(true);
    const other: Item = { id: 'r9', postId: 'p2', isLikedByMe: false, likeCount: 1 };
    expect(applyLike(other, 'p1', true)).toBe(other);
  });
});

describe('patchLikeInCacheData', () => {
  it('patches a single post', () => {
    expect(patchLikeInCacheData(post('p1'), 'p1', true).isLikedByMe).toBe(true);
  });

  it('patches the matching item across infinite pages and keeps others by reference', () => {
    const p2 = post('p2');
    const data = pages([post('p1'), p2], [post('p3')]);
    const next = patchLikeInCacheData(data, 'p1', true);
    expect(next.pages[0]?.items[0]?.isLikedByMe).toBe(true);
    expect(next.pages[0]?.items[1]).toBe(p2);
    expect(next.pages[1]).toBe(data.pages[1]);
  });

  it('returns the same reference when nothing matches', () => {
    const data = pages([post('p1')]);
    expect(patchLikeInCacheData(data, 'zzz', true)).toBe(data);
  });

  it('leaves unknown shapes alone', () => {
    const notes = { foo: 1 };
    expect(patchLikeInCacheData(notes, 'p1', true)).toBe(notes);
    expect(patchLikeInCacheData(undefined, 'p1', true)).toBeUndefined();
  });

  it('keeps feed and reels in sync for the same post id', () => {
    const feed = pages([post('p1')]);
    const reels = pages([{ id: 'p1', postId: 'p1', isLikedByMe: false, likeCount: 3 }]);
    const f = patchLikeInCacheData(feed, 'p1', true);
    const r = patchLikeInCacheData(reels, 'p1', true);
    expect(f.pages[0]?.items[0]).toMatchObject({ isLikedByMe: true, likeCount: 4 });
    expect(r.pages[0]?.items[0]).toMatchObject({ isLikedByMe: true, likeCount: 4 });
  });
});

describe('isLikeBearingQuery', () => {
  it('covers post and reel lists only', () => {
    expect(isLikeBearingQuery(['feed'])).toBe(true);
    expect(isLikeBearingQuery(['reels', 'user', 'u1'])).toBe(true);
    expect(isLikeBearingQuery(['post', 'p1'])).toBe(true);
    expect(isLikeBearingQuery(['notifications'])).toBe(false);
  });
});
