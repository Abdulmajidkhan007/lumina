import { z } from 'zod';
import { notificationIdSchema, postIdSchema, isoTimestampSchema } from './common.schema';
import { userSummarySchema } from './user.schema';

// ---------------------------------------------------------------------------
// Post preview — small thumbnail reference used inside notifications
// ---------------------------------------------------------------------------

export const notificationPostPreviewSchema = z.object({
  postId: postIdSchema,
  thumbnailUri: z.string().url(),
});

export type NotificationPostPreview = z.infer<typeof notificationPostPreviewSchema>;

// ---------------------------------------------------------------------------
// Notification — discriminated union on `type`
// ---------------------------------------------------------------------------

const notificationBaseSchema = z.object({
  id: notificationIdSchema,
  actor: userSummarySchema,
  createdAt: isoTimestampSchema,
  read: z.boolean(),
});

export const likeNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('like'),
  postPreview: notificationPostPreviewSchema,
});

export const commentNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('comment'),
  postPreview: notificationPostPreviewSchema,
  commentText: z.string(),
});

export const followNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('follow'),
});

export const mentionNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('mention'),
  postPreview: notificationPostPreviewSchema,
  /** Excerpt of the caption or comment containing the mention */
  mentionContext: z.string().optional(),
});

export const notificationSchema = z.discriminatedUnion('type', [
  likeNotificationSchema,
  commentNotificationSchema,
  followNotificationSchema,
  mentionNotificationSchema,
]);

export type LikeNotification = z.infer<typeof likeNotificationSchema>;
export type CommentNotification = z.infer<typeof commentNotificationSchema>;
export type FollowNotification = z.infer<typeof followNotificationSchema>;
export type MentionNotification = z.infer<typeof mentionNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
