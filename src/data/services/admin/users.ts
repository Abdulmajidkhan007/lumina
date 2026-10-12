/** Admin user directory: recent accounts and server-side search. */
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db, str } from './common';

export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  createdAt: string;
  lastActiveAt: string | null;
}

const RECENT_LIMIT = 50;
const SEARCH_LIMIT = 20;
const IN_CHUNK = 30;

function toRow(d: FirebaseFirestoreTypes.DocumentSnapshot): AdminUserRow | null {
  const data = d.data();
  if (!data || typeof data.username !== 'string' || typeof data.createdAt !== 'string') return null;
  return {
    id: d.id,
    username: data.username,
    displayName: str(data.displayName) ?? data.username,
    avatarUrl: str(data.avatarUrl),
    postCount: typeof data.postCount === 'number' ? data.postCount : 0,
    followerCount: typeof data.followerCount === 'number' ? data.followerCount : 0,
    createdAt: data.createdAt,
    lastActiveAt: str(data.lastActiveAt),
  };
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

function prefix(path: string, field: string, value: string) {
  return db().collection(path).orderBy(field).startAt(value).endAt(`${value}`).limit(SEARCH_LIMIT).get();
}

export async function fetchRecentUsers(): Promise<AdminUserRow[]> {
  const snap = await db().collection('users').orderBy('createdAt', 'desc').limit(RECENT_LIMIT).get();
  return compact(snap.docs.map(toRow));
}

/** Username prefix, display-name prefix (as typed + capitalized) and email prefix. */
export async function searchUsers(term: string): Promise<AdminUserRow[]> {
  const raw = term.trim().replace(/^@/, '');
  if (raw.length === 0) return fetchRecentUsers();
  const lower = raw.toLowerCase();
  const names = [...new Set([raw, raw.charAt(0).toUpperCase() + raw.slice(1)])];
  const [byUsername, byEmail, ...byName] = await Promise.all([
    prefix('users', 'usernameLower', lower),
    prefix('privateProfiles', 'emailLower', lower).catch(() => null),
    ...names.map((n) => prefix('users', 'displayName', n)),
  ]);
  const found = new Map<string, AdminUserRow>();
  for (const snap of [byUsername, ...byName]) {
    for (const row of compact(snap.docs.map(toRow))) found.set(row.id, row);
  }
  const missing = (byEmail?.docs ?? []).map((d) => d.id).filter((id) => !found.has(id));
  const extra = await Promise.all(missing.map((id) => db().collection('users').doc(id).get()));
  for (const row of compact(extra.map(toRow))) found.set(row.id, row);
  return [...found.values()];
}

/** Sign-in emails from staff-readable privateProfiles. */
export async function fetchEmails(uids: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += IN_CHUNK) chunks.push(uids.slice(i, i + IN_CHUNK));
  const snaps = await Promise.all(
    chunks.map((ids) =>
      db().collection('privateProfiles').where(firestore.FieldPath.documentId(), 'in', ids).get(),
    ),
  );
  for (const snap of snaps) {
    snap.forEach((d) => {
      const email = str(d.data().email);
      if (email) emails.set(d.id, email);
    });
  }
  return emails;
}
