import { z } from 'zod';
import { isoTimestampSchema } from './common.schema';
import { mediaSchema } from './post.schema';

// ---------------------------------------------------------------------------
// Highlight — a persistent, titled collection of story-style media pinned to
// a profile. Unlike stories, highlights never expire; the media is stored as
// its own snapshot so it survives past the 24 h story window.
// ---------------------------------------------------------------------------

export const HIGHLIGHT_TITLE_MAX = 20;

export const highlightSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(HIGHLIGHT_TITLE_MAX),
  /** Cover image shown on the profile circle. */
  coverUri: z.string(),
  /** Ordered media shown when the highlight is opened. */
  media: z.array(mediaSchema).min(1),
  createdAt: isoTimestampSchema,
});

export type Highlight = z.infer<typeof highlightSchema>;
