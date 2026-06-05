import { z } from 'zod';
import {
  postIdSchema,
  commentIdSchema,
  isoTimestampSchema,
} from './common.schema';
import { userSummarySchema } from './user.schema';

// ---------------------------------------------------------------------------
// Media — discriminated union on `type`
// ---------------------------------------------------------------------------

const mediaDimensionsSchema = z.object({
  uri: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const imageMediaSchema = mediaDimensionsSchema.extend({
  type: z.literal('image'),
});

export const videoMediaSchema = mediaDimensionsSchema.extend({
  type: z.literal('video'),
  thumbnailUri: z.string().url().optional(),
  durationMs: z.number().int().positive().optional(),
});

export const mediaSchema = z.discriminatedUnion('type', [
  imageMediaSchema,
  videoMediaSchema,
]);

export type ImageMedia = z.infer<typeof imageMediaSchema>;
export type VideoMedia = z.infer<typeof videoMediaSchema>;
export type Media = z.infer<typeof mediaSchema>;

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

export const postSchema = z.object({
  id: postIdSchema,
  author: userSummarySchema,
  media: z.array(mediaSchema).min(1),
  caption: z.string().nullable(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  isLikedByMe: z.boolean(),
  isSavedByMe: z.boolean(),
  createdAt: isoTimestampSchema,
  location: z.string().optional(),
});

export type Post = z.infer<typeof postSchema>;

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export const commentSchema = z.object({
  id: commentIdSchema,
  postId: postIdSchema,
  author: userSummarySchema,
  text: z.string(),
  likeCount: z.number().int().nonnegative(),
  isLikedByMe: z.boolean(),
  createdAt: isoTimestampSchema,
  replyCount: z.number().int().nonnegative(),
  /** Present when this comment is a reply to another comment */
  parentId: commentIdSchema.optional(),
});

export type Comment = z.infer<typeof commentSchema>;
