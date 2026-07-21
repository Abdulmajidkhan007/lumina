import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { UserSummary } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** The current user's Close Friends list. */
export function useCloseFriends(): UseQueryResult<UserSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.closeFriends(),
    queryFn: () => usersApi.getCloseFriends(),
  });
}
