import type { Story, StoryReel, Highlight, StoryId, UserId } from '@/types/models';

// ---------------------------------------------------------------------------
// Request types scoped to stories
// ---------------------------------------------------------------------------

export type CreateStoryInput = {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number;
  /** Story audience — defaults to everyone; 'closeFriends' restricts it. */
  audience?: 'all' | 'closeFriends';
};

export type HighlightMediaInput = {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number;
};

export type CreateHighlightInput = {
  title: string;
  /** Ordered media; the first item's uri doubles as the cover unless overridden. */
  media: HighlightMediaInput[];
  coverUri?: string;
};

// ---------------------------------------------------------------------------
// IStoriesApi — the swap boundary for stories
// ---------------------------------------------------------------------------

export interface IStoriesApi {
  getStoryReels(): Promise<StoryReel[]>;
  markSeen(storyId: StoryId): Promise<void>;
  createStory(input: CreateStoryInput): Promise<Story>;
  /** Records a quick emoji reaction from the current user to a story. */
  reactToStory(storyId: StoryId, emoji: string): Promise<void>;
  /** The persistent highlights pinned to `userId`'s profile, newest first. */
  getHighlights(userId: UserId): Promise<Highlight[]>;
  /** Creates a highlight owned by the current user. */
  createHighlight(input: CreateHighlightInput): Promise<Highlight>;
  /** Deletes one of the current user's highlights. */
  deleteHighlight(id: string): Promise<void>;
}
