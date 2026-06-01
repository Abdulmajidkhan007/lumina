import type { Story, StoryReel } from '@/types/models';
import { storyIdSchema } from '@/schemas';
import { mutableUsers, toUserSummary } from './users.fixture';
import type { Media } from '@/types/models';

const SAMPLE_VIDEO_URI =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

function makeStoryMedia(storyIndex: number, authorIndex: number): Media {
  // Every 4th story is a video
  if (storyIndex % 4 === 0) {
    return {
      type: 'video',
      uri: SAMPLE_VIDEO_URI,
      thumbnailUri: `https://picsum.photos/seed/story-${authorIndex}-${storyIndex}/1080/1920`,
      width: 1080,
      height: 1920,
      durationMs: 10_000,
    };
  }
  return {
    type: 'image',
    uri: `https://picsum.photos/seed/story-${authorIndex}-${storyIndex}/1080/1920`,
    width: 1080,
    height: 1920,
  };
}

let storyCounter = 0;

function makeStory(authorIndex: number, storyIndex: number): Story {
  storyCounter++;
  const now = Date.now();
  const ageMs = storyCounter * 2 * 60 * 60 * 1000; // 2h apart
  const createdAt = new Date(now - ageMs).toISOString();
  const expiresAt = new Date(now - ageMs + 24 * 60 * 60 * 1000).toISOString();
  const user = mutableUsers[authorIndex]!;

  return {
    id: storyIdSchema.parse(`story-${String(storyCounter).padStart(3, '0')}`),
    author: toUserSummary(user),
    media: makeStoryMedia(storyIndex, authorIndex),
    createdAt,
    expiresAt,
    seen: storyCounter % 3 === 0,
  };
}

// 8 story reels — users 0-7 each get 1-3 stories
export const mutableStoryReels: StoryReel[] = [
  // Current user (index 0) has 2 stories
  {
    author: toUserSummary(mutableUsers[0]!),
    stories: [makeStory(0, 0), makeStory(0, 1)],
    hasUnseen: true,
  },
  {
    author: toUserSummary(mutableUsers[1]!),
    stories: [makeStory(1, 0), makeStory(1, 1), makeStory(1, 2)],
    hasUnseen: true,
  },
  {
    author: toUserSummary(mutableUsers[2]!),
    stories: [makeStory(2, 0)],
    hasUnseen: false,
  },
  {
    author: toUserSummary(mutableUsers[3]!),
    stories: [makeStory(3, 0), makeStory(3, 1)],
    hasUnseen: true,
  },
  {
    author: toUserSummary(mutableUsers[4]!),
    stories: [makeStory(4, 0)],
    hasUnseen: true,
  },
  {
    author: toUserSummary(mutableUsers[5]!),
    stories: [makeStory(5, 0), makeStory(5, 1)],
    hasUnseen: false,
  },
  {
    author: toUserSummary(mutableUsers[6]!),
    stories: [makeStory(6, 0)],
    hasUnseen: true,
  },
  {
    author: toUserSummary(mutableUsers[7]!),
    stories: [makeStory(7, 0), makeStory(7, 1), makeStory(7, 2)],
    hasUnseen: true,
  },
];
