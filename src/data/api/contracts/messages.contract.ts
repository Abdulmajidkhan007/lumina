import type { Conversation, Message } from '@/types/models';
import type { ConversationId } from '@/types/models';
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
// IMessagesApi — the swap boundary for direct messaging
// ---------------------------------------------------------------------------

export interface IMessagesApi {
  getConversations(): Promise<Conversation[]>;
  getMessages(params: ConversationMessagesParams): Promise<Paginated<Message>>;
  sendMessage(input: SendMessageInput): Promise<Message>;
}
