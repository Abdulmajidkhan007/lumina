import type {
  IStoriesApi,
  CreateStoryInput,
  CreateHighlightInput,
  HighlightMediaInput,
} from '@/data/api/contracts';
import type { Story, StoryReel, StoryView, Highlight, Media, StoryId, UserId } from '@/types/models';
import { storyIdSchema } from '@/schemas';
import { mutableStoryReels } from './fixtures/stories.fixture';
import { currentUser, toUserSummary } from './fixtures/users.fixture';
import { mockDelay } from './latency';

/** In-memory reaction store: storyId -> uid -> { emoji, createdAt }. */
const mutableStoryReactions = new Map<string, Map<string, { emoji: string; createdAt: string }>>();

/** In-memory viewer lists: storyId -> viewer uid -> view. */
const mutableStoryViews = new Map<string, Map<string, StoryView>>();

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

  async markSeen(storyId: StoryId, authorId: UserId): Promise<void> {
    await mockDelay();
    if (authorId !== currentUser.id) {
      const views = mutableStoryViews.get(storyId) ?? new Map<string, StoryView>();
      views.set(currentUser.id, {
        viewer: toUserSummary(currentUser),
        viewedAt: new Date().toISOString(),
      });
      mutableStoryViews.set(storyId, views);
    }
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

  async getStoryViewers(storyId: StoryId): Promise<StoryView[]> {
    await mockDelay();
    return [...(mutableStoryViews.get(storyId)?.values() ?? [])].sort((a, b) =>
      b.viewedAt.localeCompare(a.viewedAt),
    );
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

  async getStoryArchive(): Promise<Story[]> {
    await mockDelay();
    return mutableStoryReels
      .filter((r) => r.author.id === currentUser.id)
      .flatMap((r) => r.stories)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addToHighlight(highlightId: string, input: HighlightMediaInput[]): Promise<Highlight> {
    await mockDelay();
    const existing = mutableHighlights.get(currentUser.id) ?? [];
    const target = existing.find((h) => h.id === highlightId);
    if (!target) throw new Error('Highlight not found');
    const known = new Set(target.media.map((m) => m.uri));
    const updated: Highlight = {
      ...target,
      media: [...target.media, ...input.filter((m) => !known.has(m.uri)).map(toMedia)],
    };
    mutableHighlights.set(
      currentUser.id,
      existing.map((h) => (h.id === highlightId ? updated : h)),
    );
    return updated;
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
