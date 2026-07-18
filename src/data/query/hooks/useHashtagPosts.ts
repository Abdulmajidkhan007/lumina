import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Post } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Pages posts tagged with `tag` (without the leading `#`), newest first. */
export function useHashtagPosts(
  tag: string,
): UseInfiniteQueryResult<InfiniteData<Paginated<Post>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.hashtag(tag),
    queryFn: ({ pageParam }) =>
      postsApi.getPostsByHashtag(tag, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: tag.trim().length > 0,
  });
}
