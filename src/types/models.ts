/**
 * Domain model types — all derived from Zod schemas via z.infer.
 * Import from here throughout the app; never define ad-hoc inline types.
 */

// Branded IDs
export type {
  UserId,
  PostId,
  CommentId,
  StoryId,
  ReelId,
  ConversationId,
  MessageId,
  NotificationId,
  IsoTimestamp,
  PaginatedEnvelope,
} from '@/schemas';

// User
export type { UserSummary, User } from '@/schemas';

// Post & Media
export type { ImageMedia, VideoMedia, Media, Post, Comment } from '@/schemas';

// Story
export type { Story, StoryReel } from '@/schemas';

// Highlight
export type { Highlight } from '@/schemas';

// Reel
export type { Reel } from '@/schemas';

// Messaging
export type {
  MessageStatus,
  Message,
  MessagePreview,
  Conversation,
} from '@/schemas';

// Notes
export type { Note } from '@/schemas';

// Notifications
export type {
  NotificationPostPreview,
  LikeNotification,
  CommentNotification,
  FollowNotification,
  MentionNotification,
  Notification,
} from '@/schemas';
