import { storyContentFit, storyTapAction } from '../storyMedia';

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
