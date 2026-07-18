import type { IStoriesApi, CreateStoryInput } from '@/data/api/contracts';
import type { Story, StoryReel , StoryId } from '@/types/models';
import { storyIdSchema } from '@/schemas';
import { mutableStoryReels } from './fixtures/stories.fixture';
import { currentUser, toUserSummary } from './fixtures/users.fixture';
import { mockDelay } from './latency';

/** In-memory reaction store: storyId -> uid -> { emoji, createdAt }. */
const mutableStoryReactions = new Map<string, Map<string, { emoji: string; createdAt: string }>>();

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

  async createStory(input: CreateStoryInput): Promise<Story> {
    await mockDelay();
    const now = Date.now();
    const newStory: Story = {
      id: storyIdSchema.parse(`story-live-${now}`),
      author: toUserSummary(currentUser),
      media:
        input.type === 'video'
          ? {
              type: 'video',
              uri: input.uri,
              width: input.width ?? 1080,
              height: input.height ?? 1920,
              ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
            }
          : {
              type: 'image',
              uri: input.uri,
              width: input.width ?? 1080,
              height: input.height ?? 1920,
            },
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      seen: true, // it's your own story — you've "seen" it by posting it
    };

    const myReel = mutableStoryReels.find((r) => r.author.id === currentUser.id);
    if (myReel) {
      myReel.stories.push(newStory);
    } else {
      mutableStoryReels.unshift({
        author: toUserSummary(currentUser),
        stories: [newStory],
        hasUnseen: false,
      });
    }

    return newStory;
  }

  async reactToStory(storyId: StoryId, emoji: string): Promise<void> {
    await mockDelay();
    const reactionsForStory = mutableStoryReactions.get(storyId) ?? new Map();
    reactionsForStory.set(currentUser.id, { emoji, createdAt: new Date().toISOString() });
    mutableStoryReactions.set(storyId, reactionsForStory);
  }
}
