import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { UserSummary } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Suggested accounts to start a conversation with (empty-inbox recommendations). */
export function useSuggestedUsers(): UseQueryResult<UserSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.suggestedUsers(),
    queryFn: () => usersApi.getSuggestedUsers(),
  });
}
