import type { Conversation, Message } from '@/types/models';
import { conversationIdSchema, messageIdSchema } from '@/schemas';
import { mutableUsers, currentUser, toUserSummary } from './users.fixture';
import { createSeededRng, seededInt } from './seed';

const rng = createSeededRng('lumina-messages-v1');

const messageTexts = [
  'Hey! Love your latest post 😍',
  'Thank you so much!',
  'Where was that shot taken?',
  'Tokyo — best city for street photography.',
  'I need to visit!',
  'You definitely should 🙌',
  'Can we collab sometime?',
  'Would love that! DM me details.',
  'Your lighting is incredible.',
  'Film — Portra 400.',
  'Amazing, that explains it all.',
  'Thanks! What camera do you use?',
  'Sony A7IV mostly.',
  'Nice! I\'ve been thinking about switching.',
  'Totally worth it.',
  'Happy Friday!',
  'You too! 🎉',
  'Just saw your story, so good.',
  'Haha thanks was just messing around.',
  'Looked very intentional to me.',
  'That\'s the secret 😄',
  'When\'s the next post?',
  'Probably this weekend.',
  'Can\'t wait!',
];

function makeTimestamp(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

let msgCounter = 0;

function makeMessage(
  conversationId: ReturnType<typeof conversationIdSchema.parse>,
  senderId: number,
  text: string,
  minutesAgo: number,
): Message {
  msgCounter++;
  const sender = mutableUsers[senderId]!;
  return {
    id: messageIdSchema.parse(`msg-${String(msgCounter).padStart(3, '0')}`),
    conversationId,
    sender: toUserSummary(sender),
    text,
    createdAt: makeTimestamp(minutesAgo),
    status: minutesAgo < 5 ? 'sent' : 'read',
  };
}

type ConvWithMessages = {
  conversation: Conversation;
  messages: Message[];
};

function buildConversation(
  index: number,
  otherUserIndex: number,
  msgPairs: { senderIndex: number; text: string; minutesAgo: number }[],
): ConvWithMessages {
  const convId = conversationIdSchema.parse(`conv-${String(index + 1).padStart(3, '0')}`);
  const otherUser = mutableUsers[otherUserIndex]!;

  const messages = msgPairs.map((m) =>
    makeMessage(convId, m.senderIndex, m.text, m.minutesAgo),
  );

  const lastMsg = messages[messages.length - 1]!;

  const conversation: Conversation = {
    id: convId,
    participants: [toUserSummary(currentUser), toUserSummary(otherUser)],
    lastMessage: {
      text: lastMsg.text,
      senderId: lastMsg.sender.id,
      createdAt: lastMsg.createdAt,
      status: lastMsg.status,
    },
    unreadCount: seededInt(0, 3, rng),
    updatedAt: lastMsg.createdAt,
  };

  return { conversation, messages };
}

const convData: ConvWithMessages[] = [
  buildConversation(0, 1, [
    { senderIndex: 1, text: messageTexts[0]!, minutesAgo: 120 },
    { senderIndex: 0, text: messageTexts[1]!, minutesAgo: 115 },
    { senderIndex: 1, text: messageTexts[2]!, minutesAgo: 110 },
    { senderIndex: 0, text: messageTexts[3]!, minutesAgo: 105 },
    { senderIndex: 1, text: messageTexts[4]!, minutesAgo: 60 },
    { senderIndex: 0, text: messageTexts[5]!, minutesAgo: 55 },
  ]),
  buildConversation(1, 2, [
    { senderIndex: 2, text: messageTexts[6]!, minutesAgo: 300 },
    { senderIndex: 0, text: messageTexts[7]!, minutesAgo: 290 },
    { senderIndex: 2, text: messageTexts[8]!, minutesAgo: 45 },
    { senderIndex: 0, text: messageTexts[9]!, minutesAgo: 40 },
    { senderIndex: 2, text: messageTexts[10]!, minutesAgo: 10 },
  ]),
  buildConversation(2, 3, [
    { senderIndex: 3, text: messageTexts[11]!, minutesAgo: 500 },
    { senderIndex: 0, text: messageTexts[12]!, minutesAgo: 495 },
    { senderIndex: 3, text: messageTexts[13]!, minutesAgo: 490 },
    { senderIndex: 0, text: messageTexts[14]!, minutesAgo: 480 },
  ]),
  buildConversation(3, 4, [
    { senderIndex: 4, text: messageTexts[15]!, minutesAgo: 1440 },
    { senderIndex: 0, text: messageTexts[16]!, minutesAgo: 1430 },
    { senderIndex: 4, text: messageTexts[17]!, minutesAgo: 30 },
    { senderIndex: 0, text: messageTexts[18]!, minutesAgo: 25 },
    { senderIndex: 4, text: messageTexts[19]!, minutesAgo: 20 },
    { senderIndex: 0, text: messageTexts[20]!, minutesAgo: 3 },
  ]),
  buildConversation(4, 5, [
    { senderIndex: 5, text: messageTexts[21]!, minutesAgo: 2880 },
    { senderIndex: 0, text: messageTexts[22]!, minutesAgo: 2870 },
    { senderIndex: 5, text: messageTexts[23]!, minutesAgo: 2860 },
  ]),
  buildConversation(5, 6, [
    { senderIndex: 6, text: messageTexts[6]!, minutesAgo: 5760 },
    { senderIndex: 0, text: messageTexts[7]!, minutesAgo: 5750 },
  ]),
];

export const mutableConversations: Conversation[] = convData.map((c) => c.conversation);

/** Flat list of all messages, keyed by conversationId for fast lookup */
export const mutableMessagesByConv: Map<string, Message[]> = new Map(
  convData.map((c) => [c.conversation.id, c.messages]),
);
