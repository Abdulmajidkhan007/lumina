/**
 * Admin panel reads + moderation decisions for the mobile app — the same
 * operations as the web admin (web/src/lib/admin.ts, web/src/lib/reports.ts).
 * Namespaced RNFirebase API on purpose (see src/lib/firebase.ts). Access is
 * enforced by firestore.rules: only the verified admin account may read
 * `reports`/`activityLogs` or write resolutions.
 */
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase';

export interface AdminReport {
  id: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  postCount: number;
  followerCount: number;
  createdAt: string;
}

export interface OverviewStats {
  totalUsers: number;
  totalPosts: number;
  activityToday: number;
  openReports: number;
}

const db = () => getFirebaseFirestore();

/** Start of "today" in device local time, ISO — activityLogs store ISO strings. */
function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function fetchReports(max = 100): Promise<AdminReport[]> {
  if (!isFirebaseConfigured()) return [];
  const snap = await db().collection('reports').orderBy('createdAt', 'desc').limit(max).get();
  return snap.docs.flatMap((d): AdminReport[] => {
    const data = d.data() as Record<string, unknown>;
    if (typeof data.createdAt !== 'string' || typeof data.targetId !== 'string') return [];
    return [
      {
        id: d.id,
        reporterId: typeof data.reporterId === 'string' ? data.reporterId : '',
        targetType: (data.targetType as AdminReport['targetType']) ?? 'post',
        targetId: data.targetId,
        reason: typeof data.reason === 'string' ? data.reason : '',
        createdAt: data.createdAt,
      },
    ];
  });
}

/** Ids of reports that already carry at least one resolution. */
export async function fetchResolvedReportIds(ids: string[]): Promise<Set<string>> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const snap = await db()
        .collection('reports')
        .doc(id)
        .collection('resolutions')
        .limit(1)
        .get();
      return snap.empty ? null : id;
    }),
  );
  return new Set(results.filter((id): id is string => id !== null));
}

/** Reports are append-only; a decision is recorded as a resolution document. */
export async function resolveReport(
  reportId: string,
  outcome: 'dismissed' | 'actioned',
): Promise<void> {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  await db().collection('reports').doc(reportId).collection('resolutions').add({
    outcome,
    moderatorId: uid,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchRecentUsers(max = 50): Promise<AdminUserRow[]> {
  if (!isFirebaseConfigured()) return [];
  const snap = await db().collection('users').orderBy('createdAt', 'desc').limit(max).get();
  return snap.docs.flatMap((d): AdminUserRow[] => {
    const data = d.data() as Record<string, unknown>;
    if (typeof data.username !== 'string' || typeof data.createdAt !== 'string') return [];
    return [
      {
        id: d.id,
        username: data.username,
        displayName: typeof data.displayName === 'string' ? data.displayName : data.username,
        postCount: typeof data.postCount === 'number' ? data.postCount : 0,
        followerCount: typeof data.followerCount === 'number' ? data.followerCount : 0,
        createdAt: data.createdAt,
      },
    ];
  });
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const [users, posts, activity, reports] = await Promise.all([
    db().collection('users').count().get(),
    db().collection('posts').count().get(),
    db().collection('activityLogs').where('createdAt', '>=', startOfTodayIso()).count().get(),
    fetchReports(),
  ]);
  const resolved = await fetchResolvedReportIds(reports.map((r) => r.id));
  return {
    totalUsers: users.data().count,
    totalPosts: posts.data().count,
    activityToday: activity.data().count,
    openReports: reports.filter((r) => !resolved.has(r.id)).length,
  };
}
