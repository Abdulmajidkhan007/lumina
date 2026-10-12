import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { StoryId, StoryView } from '@/types/models';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Who has viewed one of the current user's stories. Only the author may read it. */
export function useStoryViewers(
  storyId: StoryId | null,
  enabled: boolean,
): UseQueryResult<StoryView[], Error> {
  return useQuery({
    queryKey: queryKeys.storyViewers(storyId ?? ('' as StoryId)),
    queryFn: () => storiesApi.getStoryViewers(storyId as StoryId),
    enabled: enabled && storyId !== null,
    // Viewers trickle in while the author watches — keep it fresh.
    staleTime: 15_000,
  });
}
