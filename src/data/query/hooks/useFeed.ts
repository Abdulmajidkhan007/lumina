import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Post , UserId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useFeed(
  userId?: UserId,
): UseInfiniteQueryResult<InfiniteData<Paginated<Post>>, Error> {
  return useInfiniteQuery({
    queryKey: userId ? queryKeys.feedUser(userId) : queryKeys.feed(),
    queryFn: ({ pageParam }) =>
      postsApi.getFeed({
        cursor: pageParam as string | undefined,
        userId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
