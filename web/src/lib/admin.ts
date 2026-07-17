/**
 * Admin panel reads — user directory + dashboard stat counts.
 * All reads only; the admin panel never mutates `users`/`posts` directly.
 */
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/models';

const USERS_PAGE_LIMIT = 50;

interface UserDocFields {
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
}

function usersCollection() {
  return collection(db, 'users');
}

function toUserProfile(snap: QueryDocumentSnapshot<DocumentData>): UserProfile | null {
  const data = snap.data() as Partial<UserDocFields>;
  if (typeof data.username !== 'string' || typeof data.createdAt !== 'string') {
    return null;
  }
  return {
    id: snap.id,
    username: data.username,
    usernameLower: data.usernameLower ?? data.username.toLowerCase(),
    displayName: data.displayName ?? data.username,
    avatarUrl: data.avatarUrl ?? null,
    bio: data.bio ?? null,
    isVerified: data.isVerified ?? false,
    isPrivate: data.isPrivate ?? false,
    followerCount: data.followerCount ?? 0,
    followingCount: data.followingCount ?? 0,
    postCount: data.postCount ?? 0,
    createdAt: data.createdAt,
  };
}

/** Admin Users page: most recently created `USERS_PAGE_LIMIT` accounts. */
export async function fetchRecentUsers(): Promise<UserProfile[]> {
  const q = query(usersCollection(), orderBy('createdAt', 'desc'), limit(USERS_PAGE_LIMIT));
  const snap = await getDocs(q);
  return snap.docs.map(toUserProfile).filter((user): user is UserProfile => user !== null);
}

export interface OverviewStats {
  totalUsers: number;
  totalPosts: number;
  activityToday: number;
}

/** Start of "today" in the browser's local time, as an ISO string. */
function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const activityLogsCollection = collection(db, 'activityLogs');
  const [usersCount, postsCount, activityCount] = await Promise.all([
    getCountFromServer(usersCollection()),
    getCountFromServer(collection(db, 'posts')),
    getCountFromServer(query(activityLogsCollection, where('createdAt', '>=', startOfTodayIso()))),
  ]);
  return {
    totalUsers: usersCount.data().count,
    totalPosts: postsCount.data().count,
    activityToday: activityCount.data().count,
  };
}
