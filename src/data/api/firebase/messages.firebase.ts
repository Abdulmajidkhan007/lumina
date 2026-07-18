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
import { z } from 'zod';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type {
  IMessagesApi,
  SendMessageInput,
  SharedPostSnapshot,
  MessageWithSharedPost,
} from '@/data/api/contracts';
import type { Conversation, Message, ConversationId, UserId, PostId } from '@/types/models';
import type { Paginated, ConversationMessagesParams } from '@/types/api';
import { conversationSchema, messageSchema, postIdSchema } from '@/schemas';
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
  /** Denormalized shared-post preview — present only on "shared a post" messages. */
  sharedPost?: SharedPostSnapshot;
}

/**
 * Validates the raw `sharedPost` field on a message doc. Kept local (not in
 * `@/schemas`) since `sharedPost` deliberately rides outside the validated
 * `Message` model — this is purely a defensive-parsing guard against
 * malformed/partial doc data, mirroring the pattern `buildValidatedList` uses
 * for everything else in this file.
 */
const sharedPostDocSchema = z.object({
  postId: postIdSchema,
  thumbnailUri: z.string(),
  authorUsername: z.string(),
});

function conversationsCollection() {
  return getFirebaseFirestore().collection('conversations');
}

function conversationDocRef(id: string) {
  return getFirebaseFirestore().collection('conversations').doc(id);
}

function messagesCollection(conversationId: string) {
  return conversationDocRef(conversationId).collection('messages');
}

export class FirebaseMessagesApi implements IMessagesApi {
  async getConversations(): Promise<Conversation[]> {
    const uid = requireCurrentUid();
    const snapshot = await conversationsCollection()
      .where('participantIds', 'array-contains', uid)
      .orderBy('updatedAt', 'desc')
      .get();
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

  async getMessages(
    params: ConversationMessagesParams,
  ): Promise<Paginated<MessageWithSharedPost>> {
    const { docs, nextCursor } = await queryCreatedAtPage(
      messagesCollection(params.conversationId),
      [],
      params.cursor,
      params.limit,
    );
    // Not routed through `buildValidatedList` (unlike every other read in
    // this file) because `sharedPost` must survive alongside the validated
    // `Message` — that helper only ever returns the schema's own output type,
    // which strips unrecognized keys.
    const items: MessageWithSharedPost[] = [];
    for (const raw of docs) {
      const data = raw.data as Partial<MessageDocFields>;
      const candidate = {
        id: raw.id,
        conversationId: params.conversationId,
        sender: data.sender,
        ...(data.text !== undefined ? { text: data.text } : {}),
        ...(data.media !== undefined ? { media: data.media } : {}),
        createdAt: data.createdAt,
        status: data.status ?? 'sent',
      };
      const parsed = messageSchema.safeParse(candidate);
      if (!parsed.success) continue;
      const sharedPost = sharedPostDocSchema.safeParse(data.sharedPost);
      items.push(
        sharedPost.success ? { ...parsed.data, sharedPost: sharedPost.data } : parsed.data,
      );
    }
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
    const newMessageRef = messagesCollection(input.conversationId).doc();
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

    await getFirebaseFirestore().runTransaction(async (tx) => {
      const convSnap = await tx.get(conversationRef);
      if (!convSnap.exists()) {
        throw new Error(`Conversation ${input.conversationId} not found`);
      }
      const conv = convSnap.data() as Partial<ConversationDocFields>;
      tx.set(newMessageRef, messageDoc);
      const unreadUpdates: Record<string, FirebaseFirestoreTypes.FieldValue> = {};
      for (const participantId of conv.participantIds ?? []) {
        if (participantId !== uid) {
          unreadUpdates[`unreadCounts.${participantId}`] = firestore.FieldValue.increment(1);
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

  async getOrCreateConversation(otherUserId: UserId): Promise<Conversation> {
    const uid = requireCurrentUid();
    // Deterministic id — sorted uids joined by '_' — so repeated calls (or
    // concurrent calls from both participants) never create duplicates.
    const sortedIds = [uid, otherUserId].sort();
    const conversationId = sortedIds.join('_') as ConversationId;
    const conversationRef = conversationDocRef(conversationId);

    const existingSnap = await conversationRef.get();
    if (existingSnap.exists()) {
      const data = existingSnap.data() as Partial<ConversationDocFields>;
      return conversationSchema.parse({
        id: conversationId,
        participants: data.participants,
        ...(data.lastMessage ? { lastMessage: data.lastMessage } : {}),
        unreadCount: data.unreadCounts?.[uid] ?? 0,
        updatedAt: data.updatedAt,
      });
    }

    const [me, other] = await Promise.all([fetchUserSummary(uid), fetchUserSummary(otherUserId)]);
    if (!me || !other) {
      throw new Error('Could not resolve participant profiles for this conversation.');
    }

    const now = new Date().toISOString();
    const docFields: ConversationDocFields = {
      participantIds: sortedIds,
      participants: [me, other],
      unreadCounts: {},
      updatedAt: now,
    };
    await conversationRef.set(docFields);

    return conversationSchema.parse({
      id: conversationId,
      participants: [me, other],
      unreadCount: 0,
      updatedAt: now,
    });
  }

  /** Fetches the minimal denormalized preview needed to render a shared-post card. */
  private async fetchSharedPostSnapshot(postId: PostId): Promise<SharedPostSnapshot> {
    const snap = await getFirebaseFirestore().collection('posts').doc(postId).get();
    if (!snap.exists()) {
      throw new Error(`Post ${postId} not found`);
    }
    const data = snap.data() as { media?: Media[]; author?: UserSummary };
    const firstMedia = data.media?.[0];
    const thumbnailUri = firstMedia
      ? firstMedia.type === 'video'
        ? firstMedia.thumbnailUri ?? firstMedia.uri
        : firstMedia.uri
      : undefined;
    if (!thumbnailUri || !data.author) {
      throw new Error(`Post ${postId} is missing the data needed to share it.`);
    }
    return {
      postId: postIdSchema.parse(postId),
      thumbnailUri,
      authorUsername: data.author.username,
    };
  }

  async sharePostToConversations(
    postId: PostId,
    conversationIds: ConversationId[],
  ): Promise<void> {
    const uid = requireCurrentUid();
    const sender = await fetchUserSummary(uid);
    if (!sender) {
      throw new Error('Current user profile not found');
    }
    const sharedPost = await this.fetchSharedPostSnapshot(postId);
    const now = new Date().toISOString();
    const previewText = 'Shared a post';

    await Promise.all(
      conversationIds.map((conversationId) =>
        getFirebaseFirestore().runTransaction(async (tx) => {
          const conversationRef = conversationDocRef(conversationId);
          const convSnap = await tx.get(conversationRef);
          if (!convSnap.exists()) {
            // Conversation may have been deleted concurrently — skip it
            // rather than failing the whole batch of shares.
            return;
          }
          const conv = convSnap.data() as Partial<ConversationDocFields>;
          const newMessageRef = messagesCollection(conversationId).doc();
          const messageDoc: MessageDocFields = {
            senderId: uid,
            sender,
            text: previewText,
            createdAt: now,
            status: 'sent',
            sharedPost,
          };
          const preview: MessagePreview = {
            text: previewText,
            senderId: uid,
            createdAt: now,
            status: 'sent',
          };
          tx.set(newMessageRef, messageDoc);
          const unreadUpdates: Record<string, FirebaseFirestoreTypes.FieldValue> = {};
          for (const participantId of conv.participantIds ?? []) {
            if (participantId !== uid) {
              unreadUpdates[`unreadCounts.${participantId}`] = firestore.FieldValue.increment(1);
            }
          }
          tx.update(conversationRef, {
            lastMessage: preview,
            updatedAt: now,
            ...unreadUpdates,
          });
        }),
      ),
    );
  }
}
