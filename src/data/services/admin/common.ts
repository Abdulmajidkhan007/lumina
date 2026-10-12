/**
 * Shared plumbing for the admin services (namespaced RNFirebase API on
 * purpose — see src/lib/firebase.ts).
 */
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';

export const db = (): FirebaseFirestoreTypes.Module => getFirebaseFirestore();

export const serverTimestamp = (): FirebaseFirestoreTypes.FieldValue =>
  firestore.FieldValue.serverTimestamp();

export function currentStaff(): { uid: string; email: string | null } {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('You must be signed in.');
  return { uid: user.uid, email: user.email };
}

/** Server Timestamps (newer admin data) or ISO strings (older data) → ISO. */
export function toIso(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value !== null && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date: unknown = value.toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return null;
}

export function toMillis(value: unknown): number | null {
  const iso = toIso(value);
  return iso ? Date.parse(iso) : null;
}

export function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export const ADMIN_ACTIONS = [
  'role_change',
  'ban_user',
  'unban_user',
  'report_status',
  'report_note',
  'hide_post',
  'broadcast_send',
  'broadcast_delete',
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export interface AdminLogInput {
  action: AdminAction;
  targetType?: 'user' | 'post' | 'report' | 'broadcast';
  targetId?: string;
  note?: string;
}

/** `adminLogs` entry for a batch — shape enforced by firestore.rules. */
export function adminLogData(input: AdminLogInput): FirebaseFirestoreTypes.DocumentData {
  const me = currentStaff();
  return {
    action: input.action,
    actorId: me.uid,
    ...(me.email ? { actorEmail: me.email } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.note ? { note: input.note.slice(0, 1000) } : {}),
    createdAt: serverTimestamp(),
  };
}

export function newAdminLogRef(): FirebaseFirestoreTypes.DocumentReference {
  return db().collection('adminLogs').doc();
}
