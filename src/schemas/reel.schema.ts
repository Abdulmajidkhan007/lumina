import { z } from 'zod';
import { reelIdSchema, isoTimestampSchema } from './common.schema';
import { userSummarySchema } from './user.schema';
import { videoMediaSchema } from './post.schema';

// ---------------------------------------------------------------------------
// Reel — short-form video content
// ---------------------------------------------------------------------------

export const reelSchema = z.object({
  id: reelIdSchema,
  author: userSummarySchema,
  /** Reels are always video; thumbnailUri and durationMs are strongly recommended */
  video: videoMediaSchema,
  caption: z.string().nullable(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  shareCount: z.number().int().nonnegative(),
  isLikedByMe: z.boolean(),
  isSavedByMe: z.boolean(),
  /** Original audio track or song title shown in the UI */
  audioTitle: z.string().optional(),
  createdAt: isoTimestampSchema,
});

export type Reel = z.infer<typeof reelSchema>;
