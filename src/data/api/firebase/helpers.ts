/**
 * Shared, internal-only helpers for the Firebase API implementations.
 *
 * Not part of any public contract — everything here is an implementation
 * detail of the `*.firebase.ts` files in this directory. Keeping it in one
 * place avoids repeating the same cursor-pagination / defensive-parsing /
 * counter-transaction plumbing in every file.
 */
import type { z } from 'zod';
import {
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  where,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/** Union of everything our helpers pass to query() — matches what where/orderBy/startAfter/limit return. */
export type FirestoreQueryConstraint =
  | ReturnType<typeof where>
  | ReturnType<typeof orderBy>
  | ReturnType<typeof startAfter>
  | ReturnType<typeof limit>;
import { userSummarySchema } from '@/schemas';
import type { UserSummary } from '@/types/models';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';

export const DEFAULT_PAGE_LIMIT = 12;

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Current signed-in Firebase uid, or null when signed out. */
export function getCurrentUid(): string | null {
  return getFirebaseAuth().currentUser?.uid ?? null;
}

/** Current signed-in Firebase uid — throws for mutations that require a session. */
export function requireCurrentUid(): string {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('This action requires an authenticated user.');
  }
  return uid;
}

// ---------------------------------------------------------------------------
// Cursor pagination — mirrors the mock's Paginated<T> shape exactly, but the
// cursor here encodes {orderValue, id} of the last document so we can resume
// a Firestore query with `startAfter(orderValue, id)`. The trailing docId
// orderBy is a tiebreaker so pages stay stable even when many documents
// share the same `orderField` value (e.g. identical timestamps).
// ---------------------------------------------------------------------------

export type RawDoc = { id: string; data: FirebaseFirestoreTypes.DocumentData };

export function encodeCursor(orderValue: string, id: string): string {
  return btoa(JSON.stringify({ v: orderValue, id }));
}

export function decodeCursor(cursor: string): { orderValue: string; id: string } | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as { v?: unknown; id?: unknown };
    if (typeof parsed.v === 'string' && typeof parsed.id === 'string') {
      return { orderValue: parsed.v, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Runs a cursor-paginated query ordered by `orderField` (then by document ID
 * as a tiebreaker) and returns the raw docs for this page plus the next
 * cursor. Callers turn `docs` into domain models (see `buildValidatedList`).
 */
export async function queryCursorPage(
  base: FirebaseFirestoreTypes.CollectionReference | FirebaseFirestoreTypes.Query,
  extraConstraints: FirestoreQueryConstraint[],
  orderField: string,
  orderDirection: 'asc' | 'desc',
  cursor: string | undefined,
  limitCount: number = DEFAULT_PAGE_LIMIT,
): Promise<{ docs: RawDoc[]; nextCursor: string | null }> {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const constraints: FirestoreQueryConstraint[] = [
    ...extraConstraints,
    orderBy(orderField, orderDirection),
    orderBy(documentId(), orderDirection),
    ...(decoded ? [startAfter(decoded.orderValue, decoded.id)] : []),
    limit(limitCount),
  ];
  // RNFirebase's query() overloads don't accept a mixed constraint union via
  // spread even though every element is individually valid — collapse the
  // array to the non-filter constraint shape the first overload expects.
  const snapshot = await getDocs(
    query(base, ...(constraints as unknown as never[])),
  );
  const docs: RawDoc[] = snapshot.docs.map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
    id: docSnap.id,
    data: docSnap.data(),
  }));
  const last = docs[docs.length - 1];
  const nextCursor =
    docs.length === limitCount && last
      ? encodeCursor(String((last.data as Record<string, unknown>)[orderField] ?? ''), last.id)
      : null;
  return { docs, nextCursor };
}

/** Convenience wrapper for the common case: order by `createdAt desc`. */
export function queryCreatedAtPage(
  base: FirebaseFirestoreTypes.CollectionReference | FirebaseFirestoreTypes.Query,
  extraConstraints: FirestoreQueryConstraint[],
  cursor: string | undefined,
  limitCount?: number,
): Promise<{ docs: RawDoc[]; nextCursor: string | null }> {
  return queryCursorPage(base, extraConstraints, 'createdAt', 'desc', cursor, limitCount);
}

// ---------------------------------------------------------------------------
// Defensive parsing — build a candidate object per doc, validate it through
// the matching Zod schema, and silently skip anything that fails to parse
// (partial writes / schema drift) instead of throwing and breaking a whole
// page for one bad document.
// ---------------------------------------------------------------------------

export async function buildValidatedList<TSchema extends z.ZodTypeAny>(
  docs: RawDoc[],
  buildCandidate: (raw: RawDoc) => Promise<unknown> | unknown,
  schema: TSchema,
): Promise<z.output<TSchema>[]> {
  const candidates = await Promise.all(docs.map((raw) => buildCandidate(raw)));
  const models: z.output<TSchema>[] = [];
  for (const candidate of candidates) {
    const result = schema.safeParse(candidate);
    if (result.success) {
      models.push(result.data);
    }
  }
  return models;
}

// ---------------------------------------------------------------------------
// Like / save style membership toggles — a subcollection doc keyed by uid
// (existence = membership) plus an optional counter field on the parent
// document, updated atomically via a transaction so counts never go
// negative and never double-count concurrent taps.
// ---------------------------------------------------------------------------

export async function setMembershipFlag(params: {
  parentRef: FirebaseFirestoreTypes.DocumentReference;
  subcollection: string;
  uid: string;
  shouldExist: boolean;
  counterField?: string;
}): Promise<void> {
  const { parentRef, subcollection, uid, shouldExist, counterField } = params;
  const firestore = getFirebaseFirestore();
  const memberRef = doc(parentRef, subcollection, uid);

  await runTransaction(firestore, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    if (!parentSnap.exists()) {
      // Mirrors the mock's guard of silently no-op'ing when the target
      // post/reel no longer exists rather than throwing.
      return;
    }
    const memberSnap = await tx.get(memberRef);
    const exists = memberSnap.exists();

    if (shouldExist && !exists) {
      tx.set(memberRef, { uid, createdAt: new Date().toISOString() });
      if (counterField) {
        tx.update(parentRef, { [counterField]: increment(1) });
      }
    } else if (!shouldExist && exists) {
      tx.delete(memberRef);
      if (counterField) {
        tx.update(parentRef, { [counterField]: increment(-1) });
      }
    }
    // Otherwise the flag already matches the desired state — no-op, same as mock.
  });
}

/** Batch-checks membership subcollections (e.g. likes/saves) for one uid. */
export async function getMembershipFlags(
  parentRef: FirebaseFirestoreTypes.DocumentReference,
  subcollections: string[],
  uid: string | null,
): Promise<boolean[]> {
  if (!uid) return subcollections.map(() => false);
  const snaps = await Promise.all(subcollections.map((sub) => getDoc(doc(parentRef, sub, uid))));
  return snaps.map((snap) => snap.exists());
}

// ---------------------------------------------------------------------------
// User profile doc shape (Firestore storage shape — not the domain `User`
// type, which additionally carries viewer-relative `isFollowedByMe`/`isMe`).
// ---------------------------------------------------------------------------

export interface UserDocFields {
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

/** Fetches a `users/{id}` doc and maps it to a lightweight UserSummary embed. */
export async function fetchUserSummary(id: string): Promise<UserSummary | null> {
  const snap = await getDoc(doc(getFirebaseFirestore(), 'users', id));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserDocFields>;
  const candidate = {
    id: snap.id,
    username: data.username,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl ?? null,
    isVerified: data.isVerified ?? false,
  };
  const result = userSummarySchema.safeParse(candidate);
  return result.success ? result.data : null;
}
