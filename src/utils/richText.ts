/**
 * Rich-text parsing for captions/comments: splits plain text into
 * text / #hashtag / @mention segments for tappable rendering.
 */

export type RichSegment = {
  type: 'text' | 'hashtag' | 'mention';
  /** For hashtag/mention: the value WITHOUT the #/@ prefix. For text: raw text. */
  value: string;
};

const TOKEN_RE = /([#@])([\p{L}\p{N}_.]+)/gu;

export function parseRichText(text: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    const sigil = match[1] ?? '';
    const rawValue = match[2] ?? '';
    // Hashtags may not contain dots; trim trailing dots from mentions.
    const value =
      sigil === '#' ? rawValue.split('.')[0] ?? '' : rawValue.replace(/\.+$/, '');
    if (value.length === 0) continue;

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) });
    }
    segments.push({ type: sigil === '#' ? 'hashtag' : 'mention', value });
    lastIndex = index + sigil.length + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments;
}

/** Lowercased, deduped hashtags from a caption (max 30, Firestore array-contains friendly). */
export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const seg of parseRichText(text)) {
    if (seg.type === 'hashtag') {
      tags.add(seg.value.toLowerCase());
      if (tags.size >= 30) break;
    }
  }
  return [...tags];
}
