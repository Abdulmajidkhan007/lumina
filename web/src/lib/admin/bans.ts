/**
 * Blocked users — `userBans/{uid}`. While the document exists the rules
 * reject every write by that user (posting, commenting, liking, messaging,
 * editing the profile); reading still works.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { adminLogData, adminLogsCollection } from './adminLog';
import { timestampToIso } from './firestoreTime';

export interface UserBan {
  uid: string;
  reason: string;
  bannedBy: string;
  createdAt: string | null;
}

export async function fetchBans(): Promise<Map<string, UserBan>> {
  const snap = await getDocs(collection(db, 'userBans'));
  const bans = new Map<string, UserBan>();
  snap.forEach((d) => {
    const data = d.data();
    bans.set(d.id, {
      uid: d.id,
      reason: typeof data.reason === 'string' ? data.reason : '',
      bannedBy: typeof data.bannedBy === 'string' ? data.bannedBy : '',
      createdAt: timestampToIso(data.createdAt),
    });
  });
  return bans;
}

/** Blocks `uid` and journals it in one atomic batch. */
export async function banUser(uid: string, reason: string, reportId?: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error('You must be signed in.');
  if (me.uid === uid) throw new Error('You cannot block yourself.');
  const batch = writeBatch(db);
  batch.set(doc(db, 'userBans', uid), {
    reason: reason.slice(0, 500),
    bannedBy: me.uid,
    createdAt: serverTimestamp(),
    ...(reportId ? { reportId } : {}),
  });
  batch.set(
    doc(adminLogsCollection()),
    adminLogData({ action: 'ban_user', targetType: 'user', targetId: uid, note: reason }),
  );
  await batch.commit();
}

export async function unbanUser(uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'userBans', uid));
  batch.set(doc(adminLogsCollection()), adminLogData({ action: 'unban_user', targetType: 'user', targetId: uid }));
  await batch.commit();
}

/** Live "am I blocked?" for the signed-in user (they may read their own ban). */
export function subscribeOwnBan(uid: string, onChange: (banned: boolean) => void): () => void {
  return onSnapshot(
    doc(db, 'userBans', uid),
    (snap) => onChange(snap.exists()),
    () => onChange(false),
  );
}
