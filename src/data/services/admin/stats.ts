/** Overview numbers via count() aggregations (one read per 1000 matches). */
import { lastUtcDays } from '@/utils/admin';
import { db } from './common';

export interface DailyPoint {
  day: string;
  activeUsers: number;
  newUsers: number;
  posts: number;
}

export interface OverviewTotals {
  totalUsers: number;
  totalPosts: number;
  openReports: number;
}

export async function fetchDailySeries(days: number): Promise<DailyPoint[]> {
  const users = db().collection('users');
  const posts = db().collection('posts');
  return Promise.all(
    lastUtcDays(days).map(async (b) => {
      const [active, newUsers, newPosts] = await Promise.all([
        db().collection('activeDays').doc(b.key).collection('users').count().get(),
        users.where('createdAt', '>=', b.startIso).where('createdAt', '<', b.endIso).count().get(),
        posts.where('createdAt', '>=', b.startIso).where('createdAt', '<', b.endIso).count().get(),
      ]);
      return {
        day: b.key,
        activeUsers: active.data().count,
        newUsers: newUsers.data().count,
        posts: newPosts.data().count,
      };
    }),
  );
}

/** Open = all reports − closed, so legacy reports without status count as open. */
export async function fetchOverviewTotals(): Promise<OverviewTotals> {
  const reports = db().collection('reports');
  const [users, posts, all, closed] = await Promise.all([
    db().collection('users').count().get(),
    db().collection('posts').count().get(),
    reports.count().get(),
    reports.where('status', 'in', ['resolved', 'dismissed']).count().get(),
  ]);
  return {
    totalUsers: users.data().count,
    totalPosts: posts.data().count,
    openReports: Math.max(0, all.data().count - closed.data().count),
  };
}
