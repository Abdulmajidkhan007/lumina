import type { Story } from '@/types/models';
import {
  buildHighlightInput,
  resolveCoverId,
  storyToHighlightMedia,
  toggleStorySelection,
} from '../highlightDraft';

const author = { id: 'u1', username: 'u1', displayName: 'U', avatarUrl: null, isVerified: false };
const story = (id: string, uri = `https://cdn/${id}.jpg`): Story =>
  ({
    id,
    author,
    media: { type: 'image', uri, width: 1080, height: 1920 },
    createdAt: '2026-10-10T00:00:00.000Z',
    expiresAt: '2026-10-11T00:00:00.000Z',
    seen: true,
  }) as unknown as Story;

describe('toggleStorySelection', () => {
  it('adds in pick order and removes on second tap', () => {
    expect(toggleStorySelection([], 'a')).toEqual(['a']);
    expect(toggleStorySelection(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleStorySelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('resolveCoverId', () => {
  it('keeps a selected cover and falls back to the first pick', () => {
    expect(resolveCoverId(['a', 'b'], 'b')).toBe('b');
    expect(resolveCoverId(['a', 'b'], 'z')).toBe('a');
    expect(resolveCoverId([], 'a')).toBeNull();
  });
});

describe('buildHighlightInput', () => {
  const stories = [story('a'), story('b'), story('c')];

  it('requires at least one story and a name', () => {
    expect(buildHighlightInput('Trip', stories, [], null)).toEqual({ ok: false, error: 'noStories' });
    expect(buildHighlightInput('   ', stories, ['a'], null)).toEqual({ ok: false, error: 'noTitle' });
  });

  it('keeps pick order, trims the name and uses the chosen cover', () => {
    const result = buildHighlightInput('  Summer trip 2026 in Samarkand ', stories, ['c', 'a'], 'a');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.title).toBe('Summer trip 2026 in ');
    expect(result.input.media.map((m) => m.uri)).toEqual(['https://cdn/c.jpg', 'https://cdn/a.jpg']);
    expect(result.input.coverUri).toBe('https://cdn/a.jpg');
  });

  it('defaults the cover to the first pick', () => {
    const result = buildHighlightInput('Trip', stories, ['b', 'c'], null);
    expect(result.ok && result.input.coverUri).toBe('https://cdn/b.jpg');
  });
});

describe('storyToHighlightMedia', () => {
  it('reuses the uploaded url (no re-upload)', () => {
    expect(storyToHighlightMedia(story('a')).uri.startsWith('https://')).toBe(true);
  });
});
