import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { StoryReel } from '@/types/models';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useStoryReels(): UseQueryResult<StoryReel[], Error> {
  return useQuery({
    queryKey: queryKeys.storyReels(),
    queryFn: () => storiesApi.getStoryReels(),
  });
}
