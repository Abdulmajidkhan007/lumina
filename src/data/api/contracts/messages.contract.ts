import type { Conversation, Message , ConversationId, UserId, PostId } from '@/types/models';
import type { Paginated, ConversationMessagesParams } from '@/types/api';

// ---------------------------------------------------------------------------
// Request types scoped to messaging
// ---------------------------------------------------------------------------

export type SendMessageInput = {
  conversationId: ConversationId;
  text?: string;
  mediaUri?: string;
};

// ---------------------------------------------------------------------------
// Shared-post snapshot — a denormalized preview stored directly on a message
// doc so rendering a shared-post card never requires an extra `getPost` read.
// Deliberately kept OUTSIDE the Zod-validated `Message` model (see
// `MessageWithSharedPost` below): the shared schema in `@/schemas` stays
// untouched, and this rides alongside it as plain, implementation-owned data.
// ---------------------------------------------------------------------------

export type SharedPostSnapshot = {
  postId: PostId;
  thumbnailUri: string;
  authorUsername: string;
};

/**
 * A `Message` plus an optional denormalized shared-post preview. Structurally
 * a superset of `Message` (the extra field is optional), so it stays
 * assignable to `Message` wherever only the base shape is needed.
 */
export type MessageWithSharedPost = Message & { sharedPost?: SharedPostSnapshot };

// ---------------------------------------------------------------------------
// IMessagesApi — the swap boundary for direct messaging
// ---------------------------------------------------------------------------

export interface IMessagesApi {
  getConversations(): Promise<Conversation[]>;
  getMessages(params: ConversationMessagesParams): Promise<Paginated<MessageWithSharedPost>>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  /**
   * Deterministic get-or-create: returns the existing 1:1 conversation
   * between the current user and `otherUserId` if one exists, otherwise
   * creates it. Safe to call repeatedly — never creates duplicates.
   */
  getOrCreateConversation(otherUserId: UserId): Promise<Conversation>;
  /**
   * Shares a post into each of `conversationIds` as a message carrying a
   * denormalized `sharedPost` preview, and updates each conversation's
   * `lastMessage` preview to "Shared a post".
   */
  sharePostToConversations(postId: PostId, conversationIds: ConversationId[]): Promise<void>;
}
