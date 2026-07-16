/**
 * Firebase-backed IMessagesApi.
 *
 * Firestore schema:
 *  - `conversations/{id}` — participantIds: string[], participants (denormalized
 *    UserSummary embeds), lastMessage? (MessagePreview shape), unreadCounts:
 *    { [uid]: number }, updatedAt (ISO string).
 *    - `conversations/{id}/messages/{messageId}` — senderId, sender embed,
 *      text?, media?, createdAt, status ('sent' | 'read').
 */
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  where,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IMessagesApi, SendMessageInput } from '@/data/api/contracts';
import type { Conversation, Message, ConversationId } from '@/types/models';
import type { Paginated, ConversationMessagesParams } from '@/types/api';
import { conversationSchema, messageSchema } from '@/schemas';
import type { Media, MessagePreview, UserSummary } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import {
  buildValidatedList,
  fetchUserSummary,
  queryCreatedAtPage,
  requireCurrentUid,
  type RawDoc,
} from './helpers';

interface ConversationDocFields {
  participantIds: string[];
  participants: UserSummary[];
  lastMessage?: MessagePreview;
  unreadCounts?: Record<string, number>;
  updatedAt: string;
}

interface MessageDocFields {
  senderId: string;
  sender: UserSummary;
  text?: string;
  media?: Media;
  createdAt: string;
  status: 'sent' | 'read';
}

function conversationsCollection() {
  return collection(getFirebaseFirestore(), 'conversations');
}

function conversationDocRef(id: string) {
  return doc(getFirebaseFirestore(), 'conversations', id);
}

function messagesCollection(conversationId: string) {
  return collection(conversationDocRef(conversationId), 'messages');
}

export class FirebaseMessagesApi implements IMessagesApi {
  async getConversations(): Promise<Conversation[]> {
    const uid = requireCurrentUid();
    const snapshot = await getDocs(
      query(
        conversationsCollection(),
        where('participantIds', 'array-contains', uid),
        orderBy('updatedAt', 'desc'),
      ),
    );
    const docs: RawDoc[] = snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({ id: d.id, data: d.data() }));
    return buildValidatedList(
      docs,
      (raw: RawDoc) => {
        const data = raw.data as Partial<ConversationDocFields>;
        return {
          id: raw.id,
          participants: data.participants,
          ...(data.lastMessage ? { lastMessage: data.lastMessage } : {}),
          unreadCount: data.unreadCounts?.[uid] ?? 0,
          updatedAt: data.updatedAt,
        };
      },
      conversationSchema,
    );
  }

  async getMessages(params: ConversationMessagesParams): Promise<Paginated<Message>> {
    const { docs, nextCursor } = await queryCreatedAtPage(
      messagesCollection(params.conversationId),
      [],
      params.cursor,
      params.limit,
    );
    const items = await buildValidatedList(
      docs,
      (raw: RawDoc) => {
        const data = raw.data as Partial<MessageDocFields>;
        return {
          id: raw.id,
          conversationId: params.conversationId,
          sender: data.sender,
          ...(data.text !== undefined ? { text: data.text } : {}),
          ...(data.media !== undefined ? { media: data.media } : {}),
          createdAt: data.createdAt,
          status: data.status ?? 'sent',
        };
      },
      messageSchema,
    );
    return { items, nextCursor };
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const uid = requireCurrentUid();
    const sender = await fetchUserSummary(uid);
    if (!sender) {
      throw new Error('Current user profile not found');
    }
    if (input.text === undefined && input.mediaUri === undefined) {
      throw new Error('A message must have either text or media content');
    }

    const now = new Date().toISOString();
    // mediaUri is a device-local URI at this layer; a real deployment uploads it
    // first (see ./upload.ts) and stores the download URL. We mirror the mock's
    // permissive behavior and store it as a square image reference.
    const media: Media | undefined = input.mediaUri
      ? { type: 'image', uri: input.mediaUri, width: 1080, height: 1080 }
      : undefined;

    const conversationRef = conversationDocRef(input.conversationId);
    const newMessageRef = doc(messagesCollection(input.conversationId));
    const messageDoc: MessageDocFields = {
      senderId: uid,
      sender,
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(media !== undefined ? { media } : {}),
      createdAt: now,
      status: 'sent',
    };
    const preview: MessagePreview = {
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(media !== undefined ? { media } : {}),
      senderId: uid,
      createdAt: now,
      status: 'sent',
    };

    await runTransaction(getFirebaseFirestore(), async (tx) => {
      const convSnap = await tx.get(conversationRef);
      if (!convSnap.exists()) {
        throw new Error(`Conversation ${input.conversationId} not found`);
      }
      const conv = convSnap.data() as Partial<ConversationDocFields>;
      tx.set(newMessageRef, messageDoc);
      const unreadUpdates: Record<string, ReturnType<typeof increment>> = {};
      for (const participantId of conv.participantIds ?? []) {
        if (participantId !== uid) {
          unreadUpdates[`unreadCounts.${participantId}`] = increment(1);
        }
      }
      tx.update(conversationRef, {
        lastMessage: preview,
        updatedAt: now,
        ...unreadUpdates,
      });
    });

    return messageSchema.parse({
      id: newMessageRef.id,
      conversationId: input.conversationId as ConversationId,
      sender,
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(media !== undefined ? { media } : {}),
      createdAt: now,
      status: 'sent',
    });
  }
}
