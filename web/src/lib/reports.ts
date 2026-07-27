/**
 * `reports` collection (admin moderation queue).
 *
 * Written by any signed-in user via the mobile app's report action; readable
 * only by the admin account (see `firestore.rules`). Reports are immutable —
 * resolving one records the outcome in a separate `resolutions` subcollection
 * rather than mutating the original filing.
 */
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason: string;
  createdAt: string;
}

export async function fetchReports(): Promise<Report[]> {
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100)));
  return snap.docs
    .map((d): Report | null => {
      const data = d.data() as Record<string, unknown>;
      if (typeof data.createdAt !== 'string' || typeof data.targetId !== 'string') return null;
      return {
        id: d.id,
        reporterId: (data.reporterId as string) ?? '',
        targetType: (data.targetType as Report['targetType']) ?? 'post',
        targetId: data.targetId,
        reason: (data.reason as string) ?? '',
        createdAt: data.createdAt,
      };
    })
    .filter((r): r is Report => r !== null);
}

/**
 * Records a moderator decision. Reports themselves are append-only, so this
 * writes to `reports/{id}/resolutions` — preserving the original filing and
 * the full audit trail of decisions taken on it.
 */
export async function resolveReport(reportId: string, outcome: 'dismissed' | 'actioned'): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  await addDoc(collection(db, 'reports', reportId, 'resolutions'), {
    outcome,
    moderatorId: uid,
    createdAt: new Date().toISOString(),
  });
}

/** Ids of reports that already carry at least one resolution. */
export async function fetchResolvedReportIds(reportIds: string[]): Promise<Set<string>> {
  const results = await Promise.all(
    reportIds.map(async (id) => {
      const snap = await getDocs(query(collection(db, 'reports', id, 'resolutions'), limit(1)));
      return snap.empty ? null : id;
    }),
  );
  return new Set(results.filter((id): id is string => id !== null));
}
