/**
 * Announcements for every user (`broadcasts/{id}` — one document each, no
 * per-user fan-out) and the per-user read watermark (`broadcastReads/{uid}`).
 *
 * A user sees announcements published after they signed up: they are
 * time-bound news, so a newcomer shouldn't get months of stale items as
 * unread.
 */
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { broadcastSchema, type Broadcast } from '@/schemas/broadcast.schema';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase';

const FEED_LIMIT = 20;

function toIso(value: unknown): string | null {
  if (value instanceof firestore.Timestamp) return value.toDate().toISOString();
  return typeof value === 'string' ? value : null;
}

export function toBroadcast(id: string, data: FirebaseFirestoreTypes.DocumentData): Broadcast | null {
  const parsed = broadcastSchema.safeParse({
    id,
    title: data.title,
    body: data.body,
    link: typeof data.link === 'string' ? data.link : null,
    createdAt: toIso(data.createdAt),
  });
  return parsed.success ? parsed.data : null;
}

/** Announcements newer than `sinceIso` (the viewer's sign-up), newest first. */
export async function fetchBroadcastsSince(sinceIso: string | null): Promise<Broadcast[]> {
  if (!isFirebaseConfigured()) return [];
  let q: FirebaseFirestoreTypes.Query = getFirebaseFirestore().collection('broadcasts');
  const since = sinceIso ? new Date(sinceIso) : null;
  if (since && !Number.isNaN(since.getTime())) {
    q = q.where('createdAt', '>', firestore.Timestamp.fromDate(since));
  }
  const snap = await q.orderBy('createdAt', 'desc').limit(FEED_LIMIT).get();
  return snap.docs.flatMap((d) => {
    const b = toBroadcast(d.id, d.data());
    return b ? [b] : [];
  });
}

function readsDoc(uid: string) {
  return getFirebaseFirestore().collection('broadcastReads').doc(uid);
}

/** Read watermark in ms, or null when the user never opened Notifications. */
export async function fetchBroadcastReadAt(): Promise<number | null> {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid || !isFirebaseConfigured()) return null;
  const snap = await readsDoc(uid).get();
  const readAt: unknown = snap.data()?.readAt;
  return readAt instanceof firestore.Timestamp ? readAt.toMillis() : null;
}

export async function markBroadcastsRead(): Promise<void> {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid || !isFirebaseConfigured()) return;
  await readsDoc(uid).set({ readAt: firestore.FieldValue.serverTimestamp() });
}
