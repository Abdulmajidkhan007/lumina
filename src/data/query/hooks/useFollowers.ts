import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { UserSummary } from '@/types/models';
import type { UserId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useFollowers(
  userId: UserId,
): UseInfiniteQueryResult<InfiniteData<Paginated<UserSummary>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.followers(userId),
    queryFn: ({ pageParam }) =>
      usersApi.getFollowers(userId, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(userId),
  });
}

export function useFollowing(
  userId: UserId,
): UseInfiniteQueryResult<InfiniteData<Paginated<UserSummary>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.following(userId),
    queryFn: ({ pageParam }) =>
      usersApi.getFollowing(userId, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(userId),
  });
}
