import type { IMessagesApi, SendMessageInput } from '@/data/api/contracts';
import type { Conversation, Message, MessagePreview } from '@/types/models';
import type { Paginated, ConversationMessagesParams } from '@/types/api';
import { messageIdSchema } from '@/schemas';
import {
  mutableConversations,
  mutableMessagesByConv,
} from './fixtures/conversations.fixture';
import { currentUser, toUserSummary } from './fixtures/users.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

export class MockMessagesApi implements IMessagesApi {
  async getConversations(): Promise<Conversation[]> {
    await mockDelay();
    return [...mutableConversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getMessages(params: ConversationMessagesParams): Promise<Paginated<Message>> {
    await mockDelay();
    const messages = mutableMessagesByConv.get(params.conversationId) ?? [];
    // Reverse so newest is first (callers prepend on load-more)
    const reversed = [...messages].reverse();
    return paginateArray(reversed, params.cursor, params.limit);
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
}
