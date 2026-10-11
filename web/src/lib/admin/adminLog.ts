/**
 * `adminLogs` — journal of staff actions (role changes, blocks, report
 * decisions, broadcasts). Append-only per firestore.rules; read on the admin
 * Activity page.
 */
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { timestampToIso } from './firestoreTime';

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

export interface AdminLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  note: string | null;
  createdAt: string;
}

export interface AdminLogInput {
  action: AdminAction;
  targetType?: 'user' | 'post' | 'report' | 'broadcast';
  targetId?: string;
  note?: string;
}

/** Builds the document for a log entry; callers may add it to a batch. */
export function adminLogData(input: AdminLogInput): Record<string, unknown> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return {
    action: input.action,
    actorId: user.uid,
    ...(user.email ? { actorEmail: user.email } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.note ? { note: input.note.slice(0, 1000) } : {}),
    createdAt: serverTimestamp(),
  };
}

export function adminLogsCollection() {
  return collection(db, 'adminLogs');
}

export async function logAdminAction(input: AdminLogInput): Promise<void> {
  await addDoc(adminLogsCollection(), adminLogData(input));
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toEntry(snap: QueryDocumentSnapshot<DocumentData>): AdminLogEntry | null {
  const data = snap.data();
  const action = str(data.action);
  const actorId = str(data.actorId);
  const createdAt = timestampToIso(data.createdAt);
  if (!action || !actorId || !createdAt) return null;
  return {
    id: snap.id,
    action,
    actorId,
    actorEmail: str(data.actorEmail),
    targetType: str(data.targetType),
    targetId: str(data.targetId),
    note: str(data.note),
    createdAt,
  };
}

export async function fetchAdminLogs(max = 200): Promise<AdminLogEntry[]> {
  const snap = await getDocs(query(adminLogsCollection(), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(toEntry).filter((e): e is AdminLogEntry => e !== null);
}
