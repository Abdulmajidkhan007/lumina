/**
 * Activity log service — groundwork for the future admin panel.
 *
 * Writes a best-effort audit trail of auth-related events to the
 * `activityLogs` Firestore collection. This is intentionally decoupled from
 * `IAuthApi`: it's not part of the swap-boundary contract (mock/firebase),
 * it's a side-channel write that only ever matters when Firebase is the
 * active backend, and it must NEVER be able to fail an auth flow.
 *
 * Guarantees:
 *  - Never throws — every failure (missing config, offline, permission
 *    error, etc.) is caught and swallowed.
 *  - No-ops entirely when Firebase isn't configured (mock/dev builds).
 */
import { Platform } from 'react-native';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase';

export type ActivityLogType =
  | 'signup'
  | 'login'
  | 'google_login'
  | 'logout'
  | 'password_reset'
  | 'password_change'
  | 'account_delete'
  | 'account_deactivate'
  | 'post_create'
  | 'story_create'
  | 'follow'
  | 'unfollow'
  | 'block'
  | 'report'
  | 'professional_switch';

export interface ActivityLogEntry {
  type: ActivityLogType;
  uid: string | null;
  email: string | null;
  meta: Record<string, string>;
  createdAt: string;
  platform: 'android' | 'ios';
}

function activityLogsCollection() {
  return getFirebaseFirestore().collection('activityLogs');
}

/**
 * Records an auth-related activity event. Fire-and-forget by design — call
 * it without `await` (or with `void`) from auth flows; it resolves quickly
 * either way and never rejects.
 */
export async function logActivity(
  type: ActivityLogType,
  meta: Record<string, string> = {},
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const current = getFirebaseAuth().currentUser;
    const entry: ActivityLogEntry = {
      type,
      uid: current?.uid ?? null,
      email: current?.email ?? null,
      meta,
      createdAt: new Date().toISOString(),
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    };
    const ref = activityLogsCollection().doc();
    await ref.set(entry);
  } catch (error) {
    console.warn('[activityLog] failed to record activity:', error);
  }
}
