import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { User , UserId } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useUser(id: UserId): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => usersApi.getUser(id),
    enabled: Boolean(id),
  });
}
