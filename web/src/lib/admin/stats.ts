/**
 * Overview numbers via count() aggregations — each costs one document read
 * per 1000 matched index entries, never a full collection download.
 */
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { lastUtcDays } from './dayBuckets';

export interface DailyPoint {
  /** "YYYY-MM-DD" (UTC). */
  day: string;
  activeUsers: number;
  newUsers: number;
  posts: number;
}

export interface OverviewTotals {
  totalUsers: number;
  totalPosts: number;
  openReports: number;
  newMessages: number;
}

async function count(q: Parameters<typeof getCountFromServer>[0]): Promise<number> {
  return (await getCountFromServer(q)).data().count;
}

/** Active users, sign-ups and posts per UTC day for the last `days` days. */
export async function fetchDailySeries(days: number): Promise<DailyPoint[]> {
  const users = collection(db, 'users');
  const posts = collection(db, 'posts');
  return Promise.all(
    lastUtcDays(days).map(async (bucket) => {
      const [activeUsers, newUsers, postCount] = await Promise.all([
        count(collection(db, 'activeDays', bucket.key, 'users')),
        count(query(users, where('createdAt', '>=', bucket.startIso), where('createdAt', '<', bucket.endIso))),
        count(query(posts, where('createdAt', '>=', bucket.startIso), where('createdAt', '<', bucket.endIso))),
      ]);
      return { day: bucket.key, activeUsers, newUsers, posts: postCount };
    }),
  );
}

/**
 * Open reports = all reports minus closed ones, so reports filed before
 * statuses existed (no `status` field) count as open until reviewed.
 */
export async function fetchOverviewTotals(includeMessages: boolean): Promise<OverviewTotals> {
  const reports = collection(db, 'reports');
  const [totalUsers, totalPosts, allReports, closedReports, newMessages] = await Promise.all([
    count(collection(db, 'users')),
    count(collection(db, 'posts')),
    count(reports),
    count(query(reports, where('status', 'in', ['resolved', 'dismissed']))),
    includeMessages
      ? count(query(collection(db, 'contactMessages'), where('status', '==', 'new')))
      : Promise.resolve(0),
  ]);
  return { totalUsers, totalPosts, openReports: Math.max(0, allReports - closedReports), newMessages };
}
