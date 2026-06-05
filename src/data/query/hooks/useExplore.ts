import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Post } from '@/types/models';
import type { Paginated } from '@/types/api';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useExplore(
  query?: string,
): UseInfiniteQueryResult<InfiniteData<Paginated<Post>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.explore(query),
    queryFn: ({ pageParam }) =>
      usersApi.getExplore({
        query,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
