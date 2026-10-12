import type { Story, StoryReel, StoryView, Highlight, StoryId, UserId } from '@/types/models';

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
  /**
   * Marks a story seen by the current user and, when the viewer is not the
   * author, records them in the author-only viewer list. Viewing your own
   * story never counts as a view.
   */
  markSeen(storyId: StoryId, authorId: UserId): Promise<void>;
  /** Who has viewed one of the current user's stories, most recent first. Author-only. */
  getStoryViewers(storyId: StoryId): Promise<StoryView[]>;
  createStory(input: CreateStoryInput): Promise<Story>;
  /** Records a quick emoji reaction from the current user to a story. */
  reactToStory(storyId: StoryId, emoji: string): Promise<void>;
  /** The persistent highlights pinned to `userId`'s profile, newest first. */
  getHighlights(userId: UserId): Promise<Highlight[]>;
  /** Creates a highlight owned by the current user. */
  createHighlight(input: CreateHighlightInput): Promise<Highlight>;
  /**
   * The current user's own stories, active and expired (the story archive),
   * newest first. Highlights are built from these.
   */
  getStoryArchive(): Promise<Story[]>;
  /** Appends media (e.g. a story) to one of the current user's highlights. */
  addToHighlight(highlightId: string, media: HighlightMediaInput[]): Promise<Highlight>;
  /** Deletes one of the current user's highlights. */
  deleteHighlight(id: string): Promise<void>;
}
