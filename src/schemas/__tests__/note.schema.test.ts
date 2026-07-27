import { noteSchema, NOTE_MAX_LENGTH } from '../note.schema';
import { highlightSchema, HIGHLIGHT_TITLE_MAX } from '../highlight.schema';

const author = {
  id: 'user-1',
  username: 'aurora',
  displayName: 'Aurora',
  avatarUrl: null,
  isVerified: false,
};

const validNote = {
  author,
  text: 'out shooting today',
  createdAt: '2026-07-21T08:00:00.000Z',
  expiresAt: '2026-07-22T08:00:00.000Z',
};

describe('noteSchema', () => {
  it('accepts a well-formed note', () => {
    expect(noteSchema.parse(validNote)).toEqual(validNote);
  });

  it('rejects empty text', () => {
    expect(noteSchema.safeParse({ ...validNote, text: '' }).success).toBe(false);
  });

  it(`rejects text longer than ${NOTE_MAX_LENGTH} characters`, () => {
    const text = 'x'.repeat(NOTE_MAX_LENGTH + 1);
    expect(noteSchema.safeParse({ ...validNote, text }).success).toBe(false);
  });

  it(`accepts text exactly ${NOTE_MAX_LENGTH} characters`, () => {
    const text = 'x'.repeat(NOTE_MAX_LENGTH);
    expect(noteSchema.safeParse({ ...validNote, text }).success).toBe(true);
  });
});

describe('highlightSchema', () => {
  const validHighlight = {
    id: 'highlight-1',
    title: 'Travel',
    coverUri: 'https://example.com/cover.jpg',
    media: [{ type: 'image', uri: 'https://example.com/a.jpg', width: 1080, height: 1920 }],
    createdAt: '2026-07-21T08:00:00.000Z',
  };

  it('accepts a well-formed highlight', () => {
    expect(highlightSchema.safeParse(validHighlight).success).toBe(true);
  });

  it('requires at least one media item', () => {
    expect(highlightSchema.safeParse({ ...validHighlight, media: [] }).success).toBe(false);
  });

  it(`rejects a title longer than ${HIGHLIGHT_TITLE_MAX} characters`, () => {
    const title = 'x'.repeat(HIGHLIGHT_TITLE_MAX + 1);
    expect(highlightSchema.safeParse({ ...validHighlight, title }).success).toBe(false);
  });
});
