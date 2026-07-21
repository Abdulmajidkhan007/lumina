import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Highlight, UserId } from '@/types/models';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Highlights pinned to a user's profile. */
export function useHighlights(userId: UserId): UseQueryResult<Highlight[], Error> {
  return useQuery({
    queryKey: queryKeys.highlights(userId),
    queryFn: () => storiesApi.getHighlights(userId),
    enabled: userId.length > 0,
  });
}
