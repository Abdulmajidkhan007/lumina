/**
 * Lumina — useStoryReaction
 *
 * Fire-and-forget mutation for the story-viewer reaction bar. The `Story`
 * model carries no reaction data (no counts/list surfaced anywhere in the
 * UI yet), so there's no query cache to patch — this hook only exists to
 * keep the `storiesApi.reactToStory` call testable/mockable independently
 * of `StoryViewer`, per the service-layer/screen boundary.
 */
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { StoryId } from '@/types/models';
import { storiesApi } from '@/data/api/client';

export type StoryReactionVariables = {
  storyId: StoryId;
  emoji: string;
};

export function useStoryReaction(): UseMutationResult<void, Error, StoryReactionVariables> {
  return useMutation<void, Error, StoryReactionVariables>({
    mutationFn: ({ storyId, emoji }) => storiesApi.reactToStory(storyId, emoji),
  });
}
