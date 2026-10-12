/**
 * Staff roles — `staffRoles/{uid}` ({ role: 'moderator' | 'admin' }).
 * No document = ordinary user. The owner account is admin by email
 * (firestore.rules → isOwnerAccount()) and needs no document.
 */
import type { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ADMIN_EMAIL } from '../constants';
import { logAdminAction } from './adminLog';

export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type StaffRole = Exclude<UserRole, 'user'>;

function isStaffRole(value: unknown): value is StaffRole {
  return value === 'moderator' || value === 'admin';
}

/** Mirrors isOwnerAccount() in firestore.rules. */
export function isOwnerAccount(user: FirebaseUser | null): boolean {
  return !!user && user.email === ADMIN_EMAIL && user.emailVerified;
}

/**
 * Live role of the signed-in user. Unverified emails never count as staff
 * (the rules require email_verified), so they resolve to 'user'.
 */
export function subscribeOwnRole(user: FirebaseUser, onRole: (role: UserRole) => void): () => void {
  if (isOwnerAccount(user)) {
    onRole('admin');
    return () => {};
  }
  if (!user.emailVerified) {
    onRole('user');
    return () => {};
  }
  return onSnapshot(
    doc(db, 'staffRoles', user.uid),
    (snap) => {
      const role: unknown = snap.data()?.role;
      onRole(isStaffRole(role) ? role : 'user');
    },
    () => onRole('user'),
  );
}

/** All staff role assignments, by uid. */
export async function fetchStaffRoles(): Promise<Map<string, StaffRole>> {
  const snap = await getDocs(collection(db, 'staffRoles'));
  const roles = new Map<string, StaffRole>();
  snap.forEach((d) => {
    const role: unknown = d.data().role;
    if (isStaffRole(role)) roles.set(d.id, role);
  });
  return roles;
}

/** Admin only, never for yourself (enforced by the rules too). */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error('You must be signed in.');
  if (me.uid === uid) throw new Error('You cannot change your own role.');
  const ref = doc(db, 'staffRoles', uid);
  if (role === 'user') {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { role, updatedBy: me.uid, updatedAt: serverTimestamp() });
  }
  await logAdminAction({ action: 'role_change', targetType: 'user', targetId: uid, note: role });
}
