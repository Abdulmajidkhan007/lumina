import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { UserSummary } from '@/types/models';
import type { Paginated } from '@/types/api';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useSearchUsers(
  term: string,
): UseInfiniteQueryResult<InfiniteData<Paginated<UserSummary>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.searchUsers(term),
    queryFn: ({ pageParam }) =>
      usersApi.searchUsers(term, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: term.trim().length > 0,
  });
}
