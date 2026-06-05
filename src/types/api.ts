import type { UserId, PostId, CommentId, ConversationId } from './models';

// ---------------------------------------------------------------------------
// Generic API result wrapper
// ---------------------------------------------------------------------------

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export type ApiError = {
  code: string;
  message: string;
  /** Field-level validation errors keyed by field name */
  fieldErrors?: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// Paginated response (mirrors PaginatedEnvelope but lives in types/api.ts
// so API layer can reference it without importing from schemas directly)
// ---------------------------------------------------------------------------

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

// ---------------------------------------------------------------------------
// Request param types
// ---------------------------------------------------------------------------

export type CursorParams = {
  cursor?: string;
  limit?: number;
};

export type FeedParams = CursorParams & {
  /** Omit for the main feed; provide to scope to a single user's posts */
  userId?: UserId;
};

export type ExploreParams = CursorParams & {
  query?: string;
};

export type CommentParams = CursorParams & {
  postId: PostId;
  /** When present, fetch replies to this comment instead of top-level comments */
  parentCommentId?: CommentId;
};

export type ConversationMessagesParams = CursorParams & {
  conversationId: ConversationId;
};

export type ReelsParams = CursorParams & {
  /** Omit to get the global reels feed; provide to scope to a user */
  userId?: UserId;
};
