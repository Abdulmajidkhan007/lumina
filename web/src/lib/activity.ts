/**
 * `activityLogs` collection — write side (best-effort telemetry emitted by
 * the web app's auth flows) and read side (consumed by the admin Activity
 * page).
 *
 * Firestore schema: `activityLogs/{id}` — type, uid (nullable — some events,
 * like a password-reset request from the logged-out login page, have no
 * signed-in user yet), email (nullable), platform ('web'), createdAt (ISO
 * string).
 *
 * NOTE: this collection has no rules yet in the shared `firestore.rules`
 * (owned outside `web/`) — writes/reads will 403 until an admin adds a
 * matching rule block. See the web build report for the suggested rule.
 */
import type { User as FirebaseUser } from 'firebase/auth';
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { ActivityLog, ActivityType } from '../types/models';

function activityLogsCollection() {
  return collection(db, 'activityLogs');
}

/**
 * Fire-and-forget: logs an auth event. Never throws — a telemetry write
 * failing (offline, rules not deployed yet, etc.) must never block the
 * actual sign-in/sign-out flow it's describing.
 */
export async function logActivity(
  type: ActivityType,
  user: FirebaseUser | null,
  emailOverride?: string,
): Promise<void> {
  try {
    await addDoc(activityLogsCollection(), {
      type,
      uid: user?.uid ?? null,
      email: emailOverride ?? user?.email ?? null,
      platform: 'web',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[activity] failed to log "${type}"`, error);
  }
}

function toActivityLog(id: string, data: Record<string, unknown>): ActivityLog | null {
  const type = data.type;
  if (typeof type !== 'string' || typeof data.createdAt !== 'string') {
    return null;
  }
  return {
    id,
    type: type as ActivityType,
    uid: typeof data.uid === 'string' ? data.uid : null,
    email: typeof data.email === 'string' ? data.email : null,
    platform: typeof data.platform === 'string' ? data.platform : 'unknown',
    createdAt: data.createdAt,
  };
}

const ACTIVITY_PAGE_LIMIT = 100;

/** Admin Activity page: most recent `ACTIVITY_PAGE_LIMIT` events, newest first. */
export async function fetchRecentActivity(): Promise<ActivityLog[]> {
  const q = query(activityLogsCollection(), orderBy('createdAt', 'desc'), limit(ACTIVITY_PAGE_LIMIT));
  const snap = await getDocs(q);
  const logs: ActivityLog[] = [];
  snap.forEach((docSnap) => {
    const log = toActivityLog(docSnap.id, docSnap.data());
    if (log) logs.push(log);
  });
  return logs;
}
