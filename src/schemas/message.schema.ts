import { z } from 'zod';
import {
  conversationIdSchema,
  messageIdSchema,
  isoTimestampSchema,
} from './common.schema';
import { userSummarySchema } from './user.schema';
import { mediaSchema } from './post.schema';

// ---------------------------------------------------------------------------
// Message delivery status
// ---------------------------------------------------------------------------

export const messageStatusSchema = z.enum(['sending', 'sent', 'read']);
export type MessageStatus = z.infer<typeof messageStatusSchema>;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const messageSchema = z
  .object({
    id: messageIdSchema,
    conversationId: conversationIdSchema,
    sender: userSummarySchema,
    /** At least one of text or media must be present (enforced by refine below) */
    text: z.string().optional(),
    media: mediaSchema.optional(),
    createdAt: isoTimestampSchema,
    status: messageStatusSchema,
  })
  .refine((msg) => msg.text !== undefined || msg.media !== undefined, {
    message: 'A message must have either text or media content',
    path: ['text'],
  });

export type Message = z.infer<typeof messageSchema>;

// ---------------------------------------------------------------------------
// MessagePreview — minimal last-message snapshot stored on Conversation
// ---------------------------------------------------------------------------

export const messagePreviewSchema = z.object({
  text: z.string().optional(),
  media: mediaSchema.optional(),
  senderId: z.string(),
  createdAt: isoTimestampSchema,
  status: messageStatusSchema,
});

export type MessagePreview = z.infer<typeof messagePreviewSchema>;

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export const conversationSchema = z.object({
  id: conversationIdSchema,
  participants: z.array(userSummarySchema).min(1),
  lastMessage: messagePreviewSchema.optional(),
  unreadCount: z.number().int().nonnegative(),
  updatedAt: isoTimestampSchema,
});

export type Conversation = z.infer<typeof conversationSchema>;
