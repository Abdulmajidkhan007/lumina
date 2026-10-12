import type { StoryReel } from '@/types/models';
import { findActiveStoryReel, storyContentFit, storyTapAction } from '../storyMedia';

describe('storyContentFit', () => {
  const W = 390;
  const H = 844;

  it('fills the screen with portrait media of a similar shape', () => {
    expect(storyContentFit(1080, 1920, W, H)).toBe('cover');
    expect(storyContentFit(1080, 2340, W, H)).toBe('cover');
  });

  it('shows landscape and square media whole', () => {
    expect(storyContentFit(1920, 1080, W, H)).toBe('contain');
    expect(storyContentFit(1080, 1080, W, H)).toBe('contain');
  });

  it('falls back to cover for unknown dimensions', () => {
    expect(storyContentFit(0, 0, W, H)).toBe('cover');
  });
});

describe('storyTapAction', () => {
  it('maps the left third to prev and the rest to next', () => {
    expect(storyTapAction(10, 300)).toBe('prev');
    expect(storyTapAction(99, 300)).toBe('prev');
    expect(storyTapAction(100, 300)).toBe('next');
    expect(storyTapAction(290, 300)).toBe('next');
  });
});

describe('findActiveStoryReel', () => {
  const now = Date.parse('2026-10-11T12:00:00.000Z');
  const reel = (userId: string, expiresAt: string) =>
    ({
      author: { id: userId, username: userId, displayName: userId, avatarUrl: null, isVerified: false },
      stories: [
        {
          id: 's1',
          author: { id: userId, username: userId, displayName: userId, avatarUrl: null, isVerified: false },
          media: { type: 'image', uri: 'https://x/y.jpg', width: 1, height: 1 },
          createdAt: '2026-10-11T00:00:00.000Z',
          expiresAt,
          seen: false,
        },
      ],
      hasUnseen: true,
    }) as unknown as StoryReel;

  it('finds the user reel while a story is inside its 24 h window', () => {
    expect(findActiveStoryReel([reel('u1', '2026-10-12T00:00:00.000Z')], 'u1', now)).not.toBeNull();
  });

  it('ignores other users and expired (stale cache) reels', () => {
    expect(findActiveStoryReel([reel('u2', '2026-10-12T00:00:00.000Z')], 'u1', now)).toBeNull();
    expect(findActiveStoryReel([reel('u1', '2026-10-11T11:00:00.000Z')], 'u1', now)).toBeNull();
    expect(findActiveStoryReel(undefined, 'u1', now)).toBeNull();
  });
});
