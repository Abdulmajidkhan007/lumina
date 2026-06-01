import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Notification } from '@/types/models';
import type { Paginated } from '@/types/api';
import { notificationsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useNotifications(): UseInfiniteQueryResult<
  InfiniteData<Paginated<Notification>>,
  Error
> {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications({
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
