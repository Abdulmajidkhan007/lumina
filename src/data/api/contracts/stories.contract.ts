import type { StoryReel } from '@/types/models';
import type { StoryId } from '@/types/models';

// ---------------------------------------------------------------------------
// IStoriesApi — the swap boundary for stories
// ---------------------------------------------------------------------------

export interface IStoriesApi {
  getStoryReels(): Promise<StoryReel[]>;
  markSeen(storyId: StoryId): Promise<void>;
}
