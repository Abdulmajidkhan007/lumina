import { z } from 'zod';
import { isoTimestampSchema } from './common.schema';
import { userSummarySchema } from './user.schema';

// ---------------------------------------------------------------------------
// Note — the short, ephemeral text status ("Notes") shown at the top of the
// Direct inbox. A user has at most one active note; it expires 24 h after it
// is posted, mirroring stories.
// ---------------------------------------------------------------------------

/** Maximum length of a note's text, matching Instagram's 60-character limit. */
export const NOTE_MAX_LENGTH = 60;

export const noteSchema = z.object({
  author: userSummarySchema,
  text: z.string().min(1).max(NOTE_MAX_LENGTH),
  createdAt: isoTimestampSchema,
  /** ISO timestamp when this note expires (24 h after creation). */
  expiresAt: isoTimestampSchema,
});

export type Note = z.infer<typeof noteSchema>;
