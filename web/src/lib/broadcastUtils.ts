/**
 * Pure helpers for admin announcements (broadcasts) — validation mirrors the
 * `broadcasts` rule in firestore.rules; unread logic uses the per-user
 * `broadcastReads/{uid}.readAt` watermark.
 */

export const BROADCAST_TITLE_MAX = 120;
export const BROADCAST_BODY_MAX = 2000;
export const BROADCAST_LINK_MAX = 500;

export interface BroadcastDraft {
  title: string;
  body: string;
  link: string;
}

export type BroadcastErrors = Partial<Record<keyof BroadcastDraft, string>>;

const LINK_PATTERN = /^https?:\/\/[^ ]+$/;

/** Returns English error messages keyed by field; empty object = valid. */
export function validateBroadcast(draft: BroadcastDraft): BroadcastErrors {
  const errors: BroadcastErrors = {};
  const title = draft.title.trim();
  const body = draft.body.trim();
  const link = draft.link.trim();
  if (title.length === 0) errors.title = 'Title is required.';
  else if (title.length > BROADCAST_TITLE_MAX) errors.title = `At most ${BROADCAST_TITLE_MAX} characters.`;
  if (body.length === 0) errors.body = 'Message is required.';
  else if (body.length > BROADCAST_BODY_MAX) errors.body = `At most ${BROADCAST_BODY_MAX} characters.`;
  if (link.length > 0 && (!LINK_PATTERN.test(link) || link.length > BROADCAST_LINK_MAX)) {
    errors.link = 'Link must start with https:// (or http://).';
  }
  return errors;
}

/** True when the broadcast is newer than the user's read watermark. */
export function isBroadcastUnread(createdAtMs: number, readAtMs: number | null): boolean {
  return readAtMs === null || createdAtMs > readAtMs;
}

/** Merges two newest-first lists into one newest-first list by `createdAt` ISO. */
export function mergeNewestFirst<A extends { createdAt: string }, B extends { createdAt: string }>(
  a: readonly A[],
  b: readonly B[],
): (A | B)[] {
  return [...a, ...b].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}
