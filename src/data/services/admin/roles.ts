/** Staff roles (`staffRoles/{uid}`) and blocks (`userBans/{uid}`). */
import { isStaffRole, type StaffRole, type UserRole } from '@/utils/admin';
import { adminLogData, currentStaff, db, newAdminLogRef, serverTimestamp, str, toIso } from './common';

export interface UserBan {
  uid: string;
  reason: string;
  createdAt: string | null;
}

export async function fetchStaffRoles(): Promise<Map<string, StaffRole>> {
  const snap = await db().collection('staffRoles').get();
  const roles = new Map<string, StaffRole>();
  snap.forEach((d) => {
    const role: unknown = d.data().role;
    if (isStaffRole(role)) roles.set(d.id, role);
  });
  return roles;
}

export async function fetchBans(): Promise<Map<string, UserBan>> {
  const snap = await db().collection('userBans').get();
  const bans = new Map<string, UserBan>();
  snap.forEach((d) => {
    const data = d.data();
    bans.set(d.id, { uid: d.id, reason: str(data.reason) ?? '', createdAt: toIso(data.createdAt) });
  });
  return bans;
}

/** Admin only, never for yourself — the rules enforce the same. */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  const me = currentStaff();
  if (me.uid === uid) throw new Error('You cannot change your own role.');
  const batch = db().batch();
  const ref = db().collection('staffRoles').doc(uid);
  if (role === 'user') batch.delete(ref);
  else batch.set(ref, { role, updatedBy: me.uid, updatedAt: serverTimestamp() });
  batch.set(newAdminLogRef(), adminLogData({ action: 'role_change', targetType: 'user', targetId: uid, note: role }));
  await batch.commit();
}

export async function banUser(uid: string, reason: string, reportId?: string): Promise<void> {
  const me = currentStaff();
  if (me.uid === uid) throw new Error('You cannot block yourself.');
  const batch = db().batch();
  batch.set(db().collection('userBans').doc(uid), {
    reason: reason.slice(0, 500),
    bannedBy: me.uid,
    createdAt: serverTimestamp(),
    ...(reportId ? { reportId } : {}),
  });
  batch.set(newAdminLogRef(), adminLogData({ action: 'ban_user', targetType: 'user', targetId: uid, note: reason }));
  await batch.commit();
}

export async function unbanUser(uid: string): Promise<void> {
  const batch = db().batch();
  batch.delete(db().collection('userBans').doc(uid));
  batch.set(newAdminLogRef(), adminLogData({ action: 'unban_user', targetType: 'user', targetId: uid }));
  await batch.commit();
}
