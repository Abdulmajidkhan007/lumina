/**
 * Collab posts (web) — same model as the app (src/utils/collab.ts):
 * `posts/{id}.collab = { uid, status: 'pending'|'accepted'|'declined', user }`.
 * Shown as "A and B" / on B's grid only once accepted; pending, declined,
 * malformed and legacy `collaborators` data render as a plain post.
 */
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserSummary } from '../types/models';

type CollabStatus = 'pending' | 'accepted' | 'declined';

interface CollabField {
  uid: string;
  status: CollabStatus;
  user: UserSummary;
}

function parseCollab(value: unknown): CollabField | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const user = v.user as Partial<UserSummary> | undefined;
  if (typeof v.uid !== 'string' || !['pending', 'accepted', 'declined'].includes(String(v.status))) return null;
  if (!user || user.id !== v.uid || typeof user.username !== 'string') return null;
  return { uid: v.uid, status: v.status as CollabStatus, user: user as UserSummary };
}

/** The accepted collaborator of a post doc, if any. */
export function acceptedCollaborator(data: { collab?: unknown }): UserSummary | undefined {
  const collab = parseCollab(data.collab);
  return collab?.status === 'accepted' ? collab.user : undefined;
}

/** Accept/decline an invite (rules: only the invitee, only while pending) + record it on the notification. */
export async function respondToCollab(postId: string, notificationId: string, accept: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  const ref = doc(db, 'posts', postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const collab = parseCollab(snap.data()?.collab);
    if (!collab || collab.uid !== uid || collab.status !== 'pending') {
      throw new Error('This invite was already answered.');
    }
    tx.update(ref, { collab: { ...collab, status: accept ? 'accepted' : 'declined' } });
  });
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
    response: accept ? 'accepted' : 'declined',
    read: true,
  });
}
