import type { Story, StoryReel , StoryId } from '@/types/models';

// ---------------------------------------------------------------------------
// Request types scoped to stories
// ---------------------------------------------------------------------------

export type CreateStoryInput = {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number;
};

// ---------------------------------------------------------------------------
// IStoriesApi — the swap boundary for stories
// ---------------------------------------------------------------------------

export interface IStoriesApi {
  getStoryReels(): Promise<StoryReel[]>;
  markSeen(storyId: StoryId): Promise<void>;
  createStory(input: CreateStoryInput): Promise<Story>;
}
