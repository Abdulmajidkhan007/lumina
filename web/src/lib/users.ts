/**
 * `users` collection + `follows` graph (web) — mirrors the mobile app's
 * FirebaseUsersApi. Index-free queries (client-side sort) so no composite
 * indexes are required.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile, UserSummary } from '../types/models';

interface UserDocFields {
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
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

function followDocId(followerId: string, followeeId: string): string {
  return `${followerId}_${followeeId}`;
}

function toProfile(id: string, data: Partial<UserDocFields>): UserProfile | null {
  if (typeof data.username !== 'string' || typeof data.createdAt !== 'string') return null;
  return {
    id,
    username: data.username,
    displayName: data.displayName ?? data.username,
    avatarUrl: data.avatarUrl ?? null,
    isVerified: data.isVerified ?? false,
    usernameLower: data.usernameLower ?? data.username.toLowerCase(),
    bio: data.bio ?? null,
    isPrivate: data.isPrivate ?? false,
    followerCount: data.followerCount ?? 0,
    followingCount: data.followingCount ?? 0,
    postCount: data.postCount ?? 0,
    createdAt: data.createdAt,
  };
}

export async function fetchUser(id: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) return null;
  return toProfile(snap.id, snap.data() as Partial<UserDocFields>);
}

/** Prefix search on usernameLower (case-insensitive). */
export async function searchUsers(term: string): Promise<UserSummary[]> {
  const q = term.trim().toLowerCase();
  if (q.length === 0) return [];
  const snap = await getDocs(
    query(
      usersCollection(),
      where('usernameLower', '>=', q),
      where('usernameLower', '<=', `${q}`),
      limit(20),
    ),
  );
  return snap.docs
    .map((d) => toProfile(d.id, d.data() as Partial<UserDocFields>))
    .filter((p): p is UserProfile => p !== null)
    .map(summaryOf);
}

export async function fetchSuggestedUsers(): Promise<UserSummary[]> {
  const snap = await getDocs(query(usersCollection(), orderBy('followerCount', 'desc'), limit(20)));
  const uid = auth.currentUser?.uid;
  return snap.docs
    .map((d) => toProfile(d.id, d.data() as Partial<UserDocFields>))
    .filter((p): p is UserProfile => p !== null && p.id !== uid)
    .slice(0, 12)
    .map(summaryOf);
}

function summaryOf(p: UserProfile): UserSummary {
  return {
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    isVerified: p.isVerified,
  };
}

export async function isFollowing(followeeId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid === followeeId) return false;
  const snap = await getDoc(doc(db, 'follows', followDocId(uid, followeeId)));
  return snap.exists();
}

/** Follows/unfollows a public account, keeping both counters in sync. */
export async function setFollowing(followeeId: string, follow: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid === followeeId) return;
  const followRef = doc(db, 'follows', followDocId(uid, followeeId));
  const followerUserRef = doc(db, 'users', uid);
  const followeeUserRef = doc(db, 'users', followeeId);

  await runTransaction(db, async (tx) => {
    const [followSnap, followeeSnap] = await Promise.all([tx.get(followRef), tx.get(followeeUserRef)]);
    if (!followeeSnap.exists()) return;
    const exists = followSnap.exists();
    if (follow && !exists) {
      tx.set(followRef, { followerId: uid, followeeId, createdAt: new Date().toISOString() });
      tx.update(followeeUserRef, { followerCount: increment(1) });
      tx.update(followerUserRef, { followingCount: increment(1) });
    } else if (!follow && exists) {
      tx.delete(followRef);
      tx.update(followeeUserRef, { followerCount: increment(-1) });
      tx.update(followerUserRef, { followingCount: increment(-1) });
    }
  });
}

/** Resolves the followers or following list to user summaries (index-free). */
export async function fetchFollowEdge(
  userId: string,
  side: 'followers' | 'following',
): Promise<UserSummary[]> {
  const matchField = side === 'followers' ? 'followeeId' : 'followerId';
  const resolveField = side === 'followers' ? 'followerId' : 'followeeId';
  const snap = await getDocs(query(collection(db, 'follows'), where(matchField, '==', userId), limit(100)));
  const ids = snap.docs
    .map((d) => (d.data() as Record<string, unknown>)[resolveField])
    .filter((v): v is string => typeof v === 'string');
  const profiles = await Promise.all(ids.map((id) => fetchUser(id)));
  return profiles.filter((p): p is UserProfile => p !== null).map(summaryOf);
}

/** Ensures a profile doc exists (used by pages that may run before AuthContext writes one). */
export async function ensureProfile(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const username = (user.email?.split('@')[0] ?? `user_${user.uid.slice(0, 8)}`).toLowerCase();
  await setDoc(ref, {
    username,
    usernameLower: username,
    displayName: user.displayName ?? username,
    avatarUrl: user.photoURL ?? null,
    bio: null,
    website: null,
    isVerified: false,
    isPrivate: false,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: new Date().toISOString(),
  });
}
