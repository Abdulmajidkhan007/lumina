import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Reel , UserId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { reelsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useReels(
  userId?: UserId,
): UseInfiniteQueryResult<InfiniteData<Paginated<Reel>>, Error> {
  return useInfiniteQuery({
    queryKey: userId ? queryKeys.reelsUser(userId) : queryKeys.reels(),
    queryFn: ({ pageParam }) =>
      reelsApi.getReels({
        cursor: pageParam as string | undefined,
        userId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
