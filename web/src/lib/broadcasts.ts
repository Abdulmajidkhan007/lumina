/**
 * Admin announcements — `broadcasts/{id}`, one document per announcement
 * (no per-user fan-out). Every client reads the collection and merges it
 * into Notifications; read state is one watermark per user in
 * `broadcastReads/{uid}.readAt`.
 *
 * Which announcements a user sees: those published after they signed up.
 * Announcements are time-bound ("new version", "maintenance tonight"), so
 * showing a newcomer months of old news as unread would only add noise.
 */
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { adminLogData, adminLogsCollection, logAdminAction } from './admin/adminLog';
import { timestampToIso } from './admin/firestoreTime';
import { validateBroadcast, type BroadcastDraft } from './broadcastUtils';

const USER_FEED_LIMIT = 20;

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  createdByEmail: string | null;
}

function broadcastsCollection() {
  return collection(db, 'broadcasts');
}

function toBroadcast(d: QueryDocumentSnapshot<DocumentData>): Broadcast | null {
  const data = d.data();
  const createdAt = timestampToIso(data.createdAt);
  if (typeof data.title !== 'string' || typeof data.body !== 'string' || !createdAt) return null;
  return {
    id: d.id,
    title: data.title,
    body: data.body,
    link: typeof data.link === 'string' ? data.link : null,
    createdAt,
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : null,
  };
}

function compact(docs: QueryDocumentSnapshot<DocumentData>[]): Broadcast[] {
  return docs.map(toBroadcast).filter((b): b is Broadcast => b !== null);
}

/** Announcements published after `sinceIso` (the user's sign-up), newest first. */
export async function fetchBroadcastsSince(sinceIso: string): Promise<Broadcast[]> {
  const since = new Date(sinceIso);
  const constraints = Number.isNaN(since.getTime())
    ? [orderBy('createdAt', 'desc'), limit(USER_FEED_LIMIT)]
    : [where('createdAt', '>', Timestamp.fromDate(since)), orderBy('createdAt', 'desc'), limit(USER_FEED_LIMIT)];
  const snap = await getDocs(query(broadcastsCollection(), ...constraints));
  return compact(snap.docs);
}

/** Admin list: latest announcements regardless of audience. */
export async function fetchRecentBroadcasts(max = 50): Promise<Broadcast[]> {
  const snap = await getDocs(query(broadcastsCollection(), orderBy('createdAt', 'desc'), limit(max)));
  return compact(snap.docs);
}

/** Publishes an announcement (admin only) and journals it atomically. */
export async function publishBroadcast(draft: BroadcastDraft): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  const errors = validateBroadcast(draft);
  const firstError = Object.values(errors)[0];
  if (firstError) throw new Error(firstError);
  const ref = doc(broadcastsCollection());
  const link = draft.link.trim();
  const batch = writeBatch(db);
  batch.set(ref, {
    title: draft.title.trim(),
    body: draft.body.trim(),
    ...(link ? { link } : {}),
    createdBy: user.uid,
    ...(user.email ? { createdByEmail: user.email } : {}),
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(adminLogsCollection()),
    adminLogData({ action: 'broadcast_send', targetType: 'broadcast', targetId: ref.id, note: draft.title.trim() }),
  );
  await batch.commit();
}

export async function deleteBroadcast(id: string): Promise<void> {
  await deleteDoc(doc(broadcastsCollection(), id));
  await logAdminAction({ action: 'broadcast_delete', targetType: 'broadcast', targetId: id });
}

/** The signed-in user's read watermark (ms), or null if never read. */
export async function fetchBroadcastReadAt(): Promise<number | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'broadcastReads', uid));
  const readAt: unknown = snap.data()?.readAt;
  return readAt instanceof Timestamp ? readAt.toMillis() : null;
}

export async function markBroadcastsRead(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, 'broadcastReads', uid), { readAt: serverTimestamp() });
}
