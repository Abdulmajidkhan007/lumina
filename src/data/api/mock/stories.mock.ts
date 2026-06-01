import type { IStoriesApi } from '@/data/api/contracts';
import type { StoryReel , StoryId } from '@/types/models';
import { mutableStoryReels } from './fixtures/stories.fixture';
import { mockDelay } from './latency';

export class MockStoriesApi implements IStoriesApi {
  async getStoryReels(): Promise<StoryReel[]> {
    await mockDelay();
    return mutableStoryReels;
  }

  async markSeen(storyId: StoryId): Promise<void> {
    await mockDelay();
    for (const reel of mutableStoryReels) {
      for (const story of reel.stories) {
        if (story.id === storyId) {
          story.seen = true;
        }
      }
      // Recalculate hasUnseen
      const hasUnseen = reel.stories.some((s) => !s.seen);
      // StoryReel is readonly by Zod inference, but the fixture array contains
      // plain objects — cast to mutable to update the flag.
      (reel as { hasUnseen: boolean }).hasUnseen = hasUnseen;
    }
  }
}
