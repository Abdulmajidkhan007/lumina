import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Story } from '@/types/models';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** The current user's own stories (active + expired), newest first. */
export function useStoryArchive(enabled = true): UseQueryResult<Story[], Error> {
  return useQuery({
    queryKey: queryKeys.storyArchive(),
    queryFn: () => storiesApi.getStoryArchive(),
    enabled,
  });
}
