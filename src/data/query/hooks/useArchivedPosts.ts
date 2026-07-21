import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Post } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Infinite-scroll list of the current user's archived posts, most recent first. */
export function useArchivedPosts(): UseInfiniteQueryResult<InfiniteData<Paginated<Post>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.archivedPosts(),
    queryFn: ({ pageParam }) =>
      postsApi.getArchivedPosts({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
