/**
 * The signed-in user's moderation status: staff role (`staffRoles/{uid}`)
 * and block (`userBans/{uid}`). The owner account is admin by verified email
 * (firestore.rules → isOwnerAccount()).
 */
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase';
import { ADMIN_EMAIL } from '@/data/services/activityLog';
import { isStaffRole, type UserRole } from '@/utils/admin';

export async function fetchOwnRole(): Promise<UserRole> {
  if (!isFirebaseConfigured()) return 'user';
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.emailVerified) return 'user';
  if ((user.email ?? '').toLowerCase() === ADMIN_EMAIL) return 'admin';
  const snap = await getFirebaseFirestore().collection('staffRoles').doc(user.uid).get();
  const role: unknown = snap.data()?.role;
  return isStaffRole(role) ? role : 'user';
}

/** Live block status; returns an unsubscribe function. */
export function subscribeOwnBan(onChange: (banned: boolean) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return () => {};
  return getFirebaseFirestore()
    .collection('userBans')
    .doc(uid)
    .onSnapshot(
      (snap) => onChange(snap.exists()),
      () => onChange(false),
    );
}
