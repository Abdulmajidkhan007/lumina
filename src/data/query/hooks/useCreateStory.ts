import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Story } from '@/types/models';
import type { CreateStoryInput } from '@/data/api/contracts';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/**
 * Creates a story. No optimistic cache write — media upload can take a while
 * and we don't have a stable id/URL until the server responds — so the story
 * rail simply gets invalidated (and refetched) on success, mirroring
 * `useCreatePost`.
 */
export function useCreateStory() {
  const qc = useQueryClient();

  return useMutation<Story, Error, CreateStoryInput>({
    mutationFn: (input) => storiesApi.createStory(input),

    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.storyReels() });
    },
  });
}
