import { z } from 'zod';
import { storyIdSchema, isoTimestampSchema } from './common.schema';
import { userSummarySchema } from './user.schema';
import { mediaSchema } from './post.schema';

// ---------------------------------------------------------------------------
// Individual Story item
// ---------------------------------------------------------------------------

export const storySchema = z.object({
  id: storyIdSchema,
  author: userSummarySchema,
  media: mediaSchema,
  createdAt: isoTimestampSchema,
  /** ISO timestamp when this story expires (typically 24 h after creation) */
  expiresAt: isoTimestampSchema,
  /** Whether the current user has already viewed this story */
  seen: z.boolean(),
});

export type Story = z.infer<typeof storySchema>;

// ---------------------------------------------------------------------------
// StoryReel — one user's ordered collection of story items shown in the tray
// ---------------------------------------------------------------------------

export const storyReelSchema = z.object({
  author: userSummarySchema,
  stories: z.array(storySchema).min(1),
  /** True when at least one story in this reel has not been seen */
  hasUnseen: z.boolean(),
});

export type StoryReel = z.infer<typeof storyReelSchema>;
