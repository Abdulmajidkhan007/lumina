import type {
  IMessagesApi,
  SendMessageInput,
  SharedPostSnapshot,
  MessageWithSharedPost,
} from '@/data/api/contracts';
import type {
  Conversation,
  Message,
  MessagePreview,
  ConversationId,
  UserId,
  PostId,
} from '@/types/models';
import type { Paginated, ConversationMessagesParams } from '@/types/api';
import { messageIdSchema, conversationIdSchema } from '@/schemas';
import {
  mutableConversations,
  mutableMessagesByConv,
} from './fixtures/conversations.fixture';
import { currentUser, toUserSummary, mutableUsers } from './fixtures/users.fixture';
import { mutablePosts } from './fixtures/posts.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

const SHARED_POST_PREVIEW_TEXT = 'Shared a post';

/**
 * Side-table of message id -> shared-post snapshot. Kept separate from the
 * `Message[]` fixtures (which are strictly typed to the Zod `Message` model)
 * so `sharedPost` never has to be shoehorned into that shape — mirrors how
 * the Firestore implementation keeps it as an extra doc field alongside the
 * validated message.
 */
const sharedPostByMessageId = new Map<string, SharedPostSnapshot>();

/** Builds a denormalized shared-post snapshot from a mock post fixture. */
function buildSharedPostSnapshot(postId: PostId): SharedPostSnapshot {
  const post = mutablePosts.find((p) => p.id === postId);
  if (!post) throw new Error(`Post ${postId} not found`);
  const firstMedia = post.media[0];
  if (!firstMedia) throw new Error(`Post ${postId} has no media`);
  const thumbnailUri =
    firstMedia.type === 'video'
      ? firstMedia.thumbnailUri ?? firstMedia.uri
      : firstMedia.uri;
  return {
    postId,
    thumbnailUri,
    authorUsername: post.author.username,
  };
}

export class MockMessagesApi implements IMessagesApi {
  async getConversations(): Promise<Conversation[]> {
    await mockDelay();
    return [...mutableConversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getMessages(
    params: ConversationMessagesParams,
  ): Promise<Paginated<MessageWithSharedPost>> {
    await mockDelay();
    const messages = mutableMessagesByConv.get(params.conversationId) ?? [];
    // Reverse so newest is first (callers prepend on load-more)
    const reversed = [...messages].reverse();
    const page = paginateArray(reversed, params.cursor, params.limit);
    const items: MessageWithSharedPost[] = page.items.map((message) => {
      const sharedPost = sharedPostByMessageId.get(message.id);
      return sharedPost !== undefined ? { ...message, sharedPost } : message;
    });
    return { ...page, items };
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    await mockDelay();
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: messageIdSchema.parse(`msg-live-${Date.now()}`),
      conversationId: input.conversationId,
      sender: toUserSummary(currentUser),
      text: input.text,
      createdAt: now,
      status: 'sending',
    };

    const existing = mutableMessagesByConv.get(input.conversationId) ?? [];
    existing.push(newMessage);
    mutableMessagesByConv.set(input.conversationId, existing);

    // Update conversation preview
    const conv = mutableConversations.find((c) => c.id === input.conversationId);
    if (conv) {
      const preview: MessagePreview = {
        text: newMessage.text,
        senderId: newMessage.sender.id,
        createdAt: now,
        status: 'sent',
      };
      // Use type assertion: mutableConversations contains plain mutable objects
      const mutableConv = conv as {
        lastMessage: MessagePreview;
        updatedAt: string;
      };
      mutableConv.lastMessage = preview;
      mutableConv.updatedAt = now;
    }

    // Simulate delivery confirmation
    setTimeout(() => {
      newMessage.status = 'sent';
    }, 500);

    return newMessage;
  }

  async getOrCreateConversation(otherUserId: UserId): Promise<Conversation> {
    await mockDelay();
    const existing = mutableConversations.find(
      (c) =>
        c.participants.some((p) => p.id === currentUser.id) &&
        c.participants.some((p) => p.id === otherUserId),
    );
    if (existing) return existing;

    const otherUser = mutableUsers.find((u) => u.id === otherUserId);
    if (!otherUser) {
      throw new Error(`User ${otherUserId} not found`);
    }

    // Deterministic id mirrors the Firestore implementation: sorted uids
    // joined by '_', so repeated calls never create duplicate conversations.
    const conversationId = conversationIdSchema.parse(
      [currentUser.id, otherUserId].sort().join('_'),
    );
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: conversationId,
      participants: [toUserSummary(currentUser), toUserSummary(otherUser)],
      unreadCount: 0,
      updatedAt: now,
    };
    mutableConversations.push(conversation);
    mutableMessagesByConv.set(conversationId, []);
    return conversation;
  }

  async sharePostToConversations(
    postId: PostId,
    conversationIds: ConversationId[],
  ): Promise<void> {
    await mockDelay();
    const sharedPost = buildSharedPostSnapshot(postId);
    const now = new Date().toISOString();

    for (const conversationId of conversationIds) {
      const message: Message = {
        id: messageIdSchema.parse(`msg-shared-${Date.now()}-${conversationId}`),
        conversationId,
        sender: toUserSummary(currentUser),
        text: SHARED_POST_PREVIEW_TEXT,
        createdAt: now,
        status: 'sent',
      };
      sharedPostByMessageId.set(message.id, sharedPost);

      const existing = mutableMessagesByConv.get(conversationId) ?? [];
      existing.push(message);
      mutableMessagesByConv.set(conversationId, existing);

      const conv = mutableConversations.find((c) => c.id === conversationId);
      if (conv) {
        const preview: MessagePreview = {
          text: SHARED_POST_PREVIEW_TEXT,
          senderId: currentUser.id,
          createdAt: now,
          status: 'sent',
        };
        // Use type assertion: mutableConversations contains plain mutable objects
        const mutableConv = conv as {
          lastMessage: MessagePreview;
          updatedAt: string;
        };
        mutableConv.lastMessage = preview;
        mutableConv.updatedAt = now;
      }
    }
  }
}
