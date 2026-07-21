import type { IStoriesApi, CreateStoryInput, CreateHighlightInput } from '@/data/api/contracts';
import type { Story, StoryReel, Highlight, Media, StoryId, UserId } from '@/types/models';
import { storyIdSchema } from '@/schemas';
import { mutableStoryReels } from './fixtures/stories.fixture';
import { currentUser, toUserSummary } from './fixtures/users.fixture';
import { mockDelay } from './latency';

/** In-memory reaction store: storyId -> uid -> { emoji, createdAt }. */
const mutableStoryReactions = new Map<string, Map<string, { emoji: string; createdAt: string }>>();

/** In-memory highlights keyed by owner id. */
const mutableHighlights = new Map<string, Highlight[]>();

function toMedia(m: { uri: string; type: 'image' | 'video'; width?: number; height?: number; durationMs?: number }): Media {
  return m.type === 'video'
    ? {
        type: 'video',
        uri: m.uri,
        width: m.width ?? 1080,
        height: m.height ?? 1920,
        ...(m.durationMs !== undefined ? { durationMs: m.durationMs } : {}),
      }
    : { type: 'image', uri: m.uri, width: m.width ?? 1080, height: m.height ?? 1920 };
}

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
      audience: input.audience ?? 'all',
    };

    const isCloseFriends = newStory.audience === 'closeFriends';
    const myReel = mutableStoryReels.find((r) => r.author.id === currentUser.id);
    if (myReel) {
      myReel.stories.push(newStory);
      (myReel as { isCloseFriends?: boolean }).isCloseFriends = myReel.stories.some(
        (s) => s.audience === 'closeFriends',
      );
    } else {
      mutableStoryReels.unshift({
        author: toUserSummary(currentUser),
        stories: [newStory],
        hasUnseen: false,
        isCloseFriends,
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

  async getHighlights(userId: UserId): Promise<Highlight[]> {
    await mockDelay();
    return [...(mutableHighlights.get(userId) ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createHighlight(input: CreateHighlightInput): Promise<Highlight> {
    await mockDelay();
    const media = input.media.map(toMedia);
    const now = Date.now();
    const highlight: Highlight = {
      id: `highlight-${now}`,
      title: input.title.trim().slice(0, 20),
      coverUri: input.coverUri ?? media[0]!.uri,
      media,
      createdAt: new Date(now).toISOString(),
    };
    const existing = mutableHighlights.get(currentUser.id) ?? [];
    mutableHighlights.set(currentUser.id, [highlight, ...existing]);
    return highlight;
  }

  async deleteHighlight(id: string): Promise<void> {
    await mockDelay();
    const existing = mutableHighlights.get(currentUser.id) ?? [];
    mutableHighlights.set(
      currentUser.id,
      existing.filter((h) => h.id !== id),
    );
  }
}
