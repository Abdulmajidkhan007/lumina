import type { StoryReel , StoryId } from '@/types/models';

// ---------------------------------------------------------------------------
// IStoriesApi — the swap boundary for stories
// ---------------------------------------------------------------------------

export interface IStoriesApi {
  getStoryReels(): Promise<StoryReel[]>;
  markSeen(storyId: StoryId): Promise<void>;
}
