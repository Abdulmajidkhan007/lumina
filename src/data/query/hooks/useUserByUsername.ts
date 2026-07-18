import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { User } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/**
 * Resolves a `@mention` handle to its profile. Pass `null`/empty to skip —
 * the query stays disabled until a non-empty username is provided.
 */
export function useUserByUsername(
  username: string | null,
): UseQueryResult<User | null, Error> {
  const normalized = username?.trim() ?? '';

  return useQuery({
    queryKey: queryKeys.userByUsername(normalized),
    queryFn: () => usersApi.getUserByUsername(normalized),
    enabled: normalized.length > 0,
  });
}
