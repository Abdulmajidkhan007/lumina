import { parseRichText, extractHashtags } from '../richText';

describe('parseRichText', () => {
  it('splits text, hashtags and mentions', () => {
    expect(parseRichText('Hello #world by @user_1!')).toEqual([
      { type: 'text', value: 'Hello ' },
      { type: 'hashtag', value: 'world' },
      { type: 'text', value: ' by ' },
      { type: 'mention', value: 'user_1' },
      { type: 'text', value: '!' },
    ]);
  });

  it('returns single text segment when no tokens', () => {
    expect(parseRichText('plain caption')).toEqual([{ type: 'text', value: 'plain caption' }]);
  });

  it('supports unicode hashtags', () => {
    expect(parseRichText("#salom dunyo")[0]).toEqual({ type: 'hashtag', value: 'salom' });
  });

  it('trims trailing dots from mentions', () => {
    expect(parseRichText('cc @ali.')).toContainEqual({ type: 'mention', value: 'ali' });
  });
});

describe('extractHashtags', () => {
  it('lowercases and dedupes', () => {
    expect(extractHashtags('#Sun #sun #Moon')).toEqual(['sun', 'moon']);
  });

  it('returns empty array for no tags', () => {
    expect(extractHashtags('nothing here')).toEqual([]);
  });
});
