/**
 * Shared, internal-only helpers for the Firebase API implementations.
 *
 * Not part of any public contract — everything here is an implementation
 * detail of the `*.firebase.ts` files in this directory. Keeping it in one
 * place avoids repeating the same cursor-pagination / defensive-parsing /
 * counter-transaction plumbing in every file.
 *
 * Uses the NAMESPACED (chainable) Firestore API — `firestore()`,
 * `collectionRef.doc()`, `queryRef.where()/.orderBy()/.get()`, etc — rather
 * than the modular `query()/where()/getDocs()` functions. The modular API
 * has been observed to throw "Cannot read property 'call' of undefined" in
 * RELEASE Hermes builds; the namespaced API does not go through the same
 * interop shim and is release-stable. See `src/lib/firebase.ts` for the
 * accessor that hands out the namespaced `Firestore.Module` instance.
 */
import type { z } from 'zod';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
// Query constraints — a small `where()` builder that mirrors the modular
// API's ergonomics (an array of constraints callers can conditionally spread
// in) while compiling down to a chain of namespaced `.where()` calls.
// ---------------------------------------------------------------------------

export type FirestoreQueryConstraint = (
  q: FirebaseFirestoreTypes.Query,
) => FirebaseFirestoreTypes.Query;

export function where(
  field: string,
  op: FirebaseFirestoreTypes.WhereFilterOp,
  value: unknown,
): FirestoreQueryConstraint {
  return (q) => q.where(field, op, value);
}

function applyConstraints(
  base: FirebaseFirestoreTypes.CollectionReference | FirebaseFirestoreTypes.Query,
  constraints: FirestoreQueryConstraint[],
): FirebaseFirestoreTypes.Query {
  let current: FirebaseFirestoreTypes.Query = base;
  for (const constraint of constraints) {
    current = constraint(current);
  }
  return current;
}

// ---------------------------------------------------------------------------
// Cursor pagination — mirrors the mock's Paginated<T> shape exactly, but the
// cursor here encodes {orderValue, id} of the last document so we can resume
// a Firestore query with `.startAfter(orderValue, id)`. The trailing docId
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

  let q = applyConstraints(base, extraConstraints);
  q = q.orderBy(orderField, orderDirection).orderBy(firestore.FieldPath.documentId(), orderDirection);
  if (decoded) {
    q = q.startAfter(decoded.orderValue, decoded.id);
  }
  q = q.limit(limitCount);

  const snapshot = await q.get();
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
  const db = getFirebaseFirestore();
  const memberRef = parentRef.collection(subcollection).doc(uid);

  await db.runTransaction(async (tx) => {
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
        tx.update(parentRef, { [counterField]: firestore.FieldValue.increment(1) });
      }
    } else if (!shouldExist && exists) {
      tx.delete(memberRef);
      if (counterField) {
        tx.update(parentRef, { [counterField]: firestore.FieldValue.increment(-1) });
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
  const snaps = await Promise.all(
    subcollections.map((sub) => parentRef.collection(sub).doc(uid).get()),
  );
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
  website: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
}

/** Fetches a `users/{id}` doc and maps it to a lightweight UserSummary embed. */
export async function fetchUserSummary(id: string): Promise<UserSummary | null> {
  const snap = await getFirebaseFirestore().collection('users').doc(id).get();
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

// ---------------------------------------------------------------------------
// Defensive error surfacing — a last line of defence around query-building
// paths so an unexpected engine/SDK-internal failure (e.g. a cryptic
// "Cannot read property 'call' of undefined" from a native module edge case)
// never reaches the UI as-is. Logs the real error for diagnostics and
// rethrows a message that is actually actionable.
// ---------------------------------------------------------------------------

export async function withReadableErrors<T>(operation: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[firebase] ${operation} failed:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${operation}. ${detail}`);
  }
}
