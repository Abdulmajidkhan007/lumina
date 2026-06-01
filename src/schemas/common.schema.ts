import { z } from 'zod';

// ---------------------------------------------------------------------------
// Branded ID helpers
// ---------------------------------------------------------------------------

export const userIdSchema = z.string().brand<'UserId'>();
export const postIdSchema = z.string().brand<'PostId'>();
export const commentIdSchema = z.string().brand<'CommentId'>();
export const storyIdSchema = z.string().brand<'StoryId'>();
export const reelIdSchema = z.string().brand<'ReelId'>();
export const conversationIdSchema = z.string().brand<'ConversationId'>();
export const messageIdSchema = z.string().brand<'MessageId'>();
export const notificationIdSchema = z.string().brand<'NotificationId'>();

export type UserId = z.infer<typeof userIdSchema>;
export type PostId = z.infer<typeof postIdSchema>;
export type CommentId = z.infer<typeof commentIdSchema>;
export type StoryId = z.infer<typeof storyIdSchema>;
export type ReelId = z.infer<typeof reelIdSchema>;
export type ConversationId = z.infer<typeof conversationIdSchema>;
export type MessageId = z.infer<typeof messageIdSchema>;
export type NotificationId = z.infer<typeof notificationIdSchema>;

// ---------------------------------------------------------------------------
// ISO timestamp
// ---------------------------------------------------------------------------

export const isoTimestampSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 timestamp' });

export type IsoTimestamp = z.infer<typeof isoTimestampSchema>;

// ---------------------------------------------------------------------------
// Paginated cursor envelope helper
// ---------------------------------------------------------------------------

/**
 * Returns a Zod schema for a paginated response wrapping itemSchema.
 * Usage: paginated(postSchema)
 */
export function paginated<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

export type PaginatedEnvelope<T> = {
  items: T[];
  nextCursor: string | null;
};
