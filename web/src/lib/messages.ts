/**
 * `conversations` + messages (web) — mirrors the mobile FirebaseMessagesApi.
 * Index-free reads (client-side sort). 1:1 conversations use a deterministic
 * id (sorted uids joined by '_') so both sides resolve the same doc.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserSummary } from '../types/models';

export interface MessagePreview {
  text?: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: UserSummary[];
  lastMessage?: MessagePreview;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  sender: UserSummary;
  text?: string;
  createdAt: string;
}

async function currentSummary(): Promise<UserSummary> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  const snap = await getDoc(doc(db, 'users', uid));
  const a = snap.data() as Record<string, unknown> | undefined;
  return {
    id: uid,
    username: (a?.username as string) ?? 'you',
    displayName: (a?.displayName as string) ?? 'You',
    avatarUrl: (a?.avatarUrl as string | null) ?? null,
    isVerified: (a?.isVerified as boolean) ?? false,
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const participants = (data.participants as UserSummary[]) ?? [];
      const unreadCounts = (data.unreadCounts as Record<string, number>) ?? {};
      return {
        id: d.id,
        participants,
        lastMessage: data.lastMessage as MessagePreview | undefined,
        unreadCount: unreadCounts[uid] ?? 0,
        updatedAt: (data.updatedAt as string) ?? '',
      } satisfies Conversation;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  const id = [uid, otherUserId].sort().join('_');
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;

  const [me, other] = await Promise.all([
    currentSummary(),
    getDoc(doc(db, 'users', otherUserId)),
  ]);
  const oa = other.data() as Record<string, unknown> | undefined;
  if (!oa) throw new Error('User not found.');
  const otherSummary: UserSummary = {
    id: otherUserId,
    username: (oa.username as string) ?? 'user',
    displayName: (oa.displayName as string) ?? 'User',
    avatarUrl: (oa.avatarUrl as string | null) ?? null,
    isVerified: (oa.isVerified as boolean) ?? false,
  };
  await setDoc(ref, {
    participantIds: [uid, otherUserId].sort(),
    participants: [me, otherSummary],
    unreadCounts: {},
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const snap = await getDocs(collection(db, 'conversations', conversationId, 'messages'));
  return snap.docs
    .map((d): Message | null => {
      const data = d.data() as Record<string, unknown>;
      if (!data.sender || typeof data.createdAt !== 'string') return null;
      return {
        id: d.id,
        senderId: (data.senderId as string) ?? '',
        sender: data.sender as UserSummary,
        text: data.text as string | undefined,
        createdAt: data.createdAt,
      };
    })
    .filter((m): m is Message => m !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Live subscription to a thread's messages. Returns the unsubscribe function —
 * real-time delivery, so no polling is needed.
 */
export function subscribeToMessages(
  conversationId: string,
  onChange: (messages: Message[]) => void,
): () => void {
  return onSnapshot(collection(db, 'conversations', conversationId, 'messages'), (snap) => {
    const messages = snap.docs
      .map((d): Message | null => {
        const data = d.data() as Record<string, unknown>;
        if (!data.sender || typeof data.createdAt !== 'string') return null;
        return {
          id: d.id,
          senderId: (data.senderId as string) ?? '',
          sender: data.sender as UserSummary,
          text: data.text as string | undefined,
          createdAt: data.createdAt,
        };
      })
      .filter((m): m is Message => m !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    onChange(messages);
  });
}

export async function sendMessage(conversationId: string, text: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  const sender = await currentSummary();
  const now = new Date().toISOString();
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId: uid,
    sender,
    text,
    createdAt: now,
    status: 'sent',
  });
  await runTransaction(db, async (tx) => {
    const convRef = doc(db, 'conversations', conversationId);
    const conv = await tx.get(convRef);
    if (!conv.exists()) return;
    const data = conv.data() as Record<string, unknown>;
    const others = ((data.participantIds as string[]) ?? []).filter((p) => p !== uid);
    const unreadUpdates: Record<string, unknown> = {};
    for (const p of others) unreadUpdates[`unreadCounts.${p}`] = increment(1);
    tx.update(convRef, {
      lastMessage: { text, senderId: uid, createdAt: now },
      updatedAt: now,
      ...unreadUpdates,
    });
  });
}
