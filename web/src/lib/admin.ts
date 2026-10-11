/**
 * Admin panel reads — user directory and search. Role / block changes live
 * in lib/admin/roles.ts and lib/admin/bans.ts; overview counts in
 * lib/admin/stats.ts.
 */
import {
  type DocumentData,
  type DocumentSnapshot,
  collection,
  documentId,
  endAt,
  getDoc,
  getDocs,
  doc,
  limit,
  orderBy,
  query,
  startAt,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/models';

const USERS_PAGE_LIMIT = 50;
const SEARCH_LIMIT = 20;
/** Firestore `in` filters accept at most 30 values. */
const IN_CHUNK = 30;

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
  lastActiveAt: string;
}

export interface AdminUser extends UserProfile {
  /** ISO 8601; null for users not seen since presence tracking started. */
  lastActiveAt: string | null;
}

function usersCollection() {
  return collection(db, 'users');
}

function toAdminUser(snap: DocumentSnapshot<DocumentData>): AdminUser | null {
  const data = snap.data() as Partial<UserDocFields> | undefined;
  if (!data || typeof data.username !== 'string' || typeof data.createdAt !== 'string') {
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
    lastActiveAt: typeof data.lastActiveAt === 'string' ? data.lastActiveAt : null,
  };
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

/** Admin Users page: most recently created `USERS_PAGE_LIMIT` accounts. */
export async function fetchRecentUsers(): Promise<AdminUser[]> {
  const q = query(usersCollection(), orderBy('createdAt', 'desc'), limit(USERS_PAGE_LIMIT));
  const snap = await getDocs(q);
  return compact(snap.docs.map(toAdminUser));
}

/** Prefix range query: `field` starts with `prefix`. */
function prefixQuery(path: string, field: string, prefix: string) {
  return query(collection(db, path), orderBy(field), startAt(prefix), endAt(`${prefix}`), limit(SEARCH_LIMIT));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Server-side search by username prefix, display-name prefix (as typed and
 * capitalized — the field has no lowercase copy) and sign-in email prefix
 * (privateProfiles, staff-readable). Results are de-duplicated.
 */
export async function searchUsers(term: string): Promise<AdminUser[]> {
  const raw = term.trim().replace(/^@/, '');
  if (raw.length === 0) return fetchRecentUsers();
  const lower = raw.toLowerCase();
  const nameVariants = [...new Set([raw, capitalize(raw)])];

  const [byUsername, byEmail, ...byName] = await Promise.all([
    getDocs(prefixQuery('users', 'usernameLower', lower)),
    getDocs(prefixQuery('privateProfiles', 'emailLower', lower)).catch(() => null),
    ...nameVariants.map((v) => getDocs(prefixQuery('users', 'displayName', v))),
  ]);

  const found = new Map<string, AdminUser>();
  for (const snap of [byUsername, ...byName]) {
    for (const user of compact(snap.docs.map(toAdminUser))) found.set(user.id, user);
  }
  const emailIds = (byEmail?.docs ?? []).map((d) => d.id).filter((id) => !found.has(id));
  const emailUsers = await Promise.all(emailIds.map((id) => getDoc(doc(db, 'users', id))));
  for (const user of compact(emailUsers.map(toAdminUser))) found.set(user.id, user);
  return [...found.values()];
}

/** Sign-in emails for the given users (staff-readable `privateProfiles`). */
export async function fetchEmails(uids: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += IN_CHUNK) chunks.push(uids.slice(i, i + IN_CHUNK));
  const snaps = await Promise.all(
    chunks.map((ids) => getDocs(query(collection(db, 'privateProfiles'), where(documentId(), 'in', ids)))),
  );
  for (const snap of snaps) {
    snap.forEach((d) => {
      const email: unknown = d.data().email;
      if (typeof email === 'string') emails.set(d.id, email);
    });
  }
  return emails;
}
