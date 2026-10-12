/**
 * Collab posts — pure helpers shared by the data layer (unit-tested).
 *
 * Stored as `posts/{id}.collab = { uid, status, user }`. A collab is shown
 * ("A and B" in the header, on B's grid) ONLY once the invited profile has
 * accepted. Anything else — pending, declined, malformed, or legacy posts
 * that only carry the old unconfirmed `collaborators` array — renders as a
 * plain post by its author.
 */

export const COLLAB_STATUSES = ['pending', 'accepted', 'declined'] as const;
export type CollabStatus = (typeof COLLAB_STATUSES)[number];

export interface CollabUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface CollabField<TUser extends CollabUserSummary = CollabUserSummary> {
  uid: string;
  status: CollabStatus;
  user: TUser;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Narrows an unknown Firestore value to a well-formed collab field, else null. */
export function parseCollab(value: unknown): CollabField | null {
  if (!isRecord(value)) return null;
  const { uid, status, user } = value;
  if (typeof uid !== 'string' || uid.length === 0) return null;
  if (typeof status !== 'string' || !(COLLAB_STATUSES as readonly string[]).includes(status)) return null;
  if (!isRecord(user) || user.id !== uid || typeof user.username !== 'string') return null;
  return {
    uid,
    status: status as CollabStatus,
    user: {
      id: uid,
      username: user.username,
      displayName: typeof user.displayName === 'string' ? user.displayName : user.username,
      avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
      isVerified: user.isVerified === true,
    },
  };
}

/**
 * Co-authors to display for a post doc: the collaborator only when accepted.
 * The legacy `collaborators` array is deliberately ignored — it was written
 * without the invitee's consent.
 */
export function visibleCollaborators(doc: { collab?: unknown }): CollabUserSummary[] | undefined {
  const collab = parseCollab(doc.collab);
  return collab?.status === 'accepted' ? [collab.user] : undefined;
}

/** Whether `uid` may answer the invite on this post (pending and addressed to them). */
export function canRespondToCollab(doc: { collab?: unknown }, uid: string): boolean {
  const collab = parseCollab(doc.collab);
  return collab !== null && collab.uid === uid && collab.status === 'pending';
}

/**
 * Merges a profile's own page of posts with the accepted collabs that fall
 * inside the same createdAt window — (lowerBound, upperBound] — so collab
 * posts appear in date order across pages without duplicates.
 */
export function mergeCollabPosts<T extends { id: string; createdAt: string }>(
  own: readonly T[],
  collabs: readonly T[],
  upperBound: string | null,
  lowerBound: string | null,
): T[] {
  const seen = new Set(own.map((p) => p.id));
  const inWindow = collabs.filter(
    (p) =>
      !seen.has(p.id) &&
      (upperBound === null || p.createdAt < upperBound) &&
      (lowerBound === null || p.createdAt >= lowerBound),
  );
  return [...own, ...inWindow].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
