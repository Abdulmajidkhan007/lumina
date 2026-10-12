/**
 * Pure helpers for the admin panel and announcements — UTC day buckets
 * (activeDays/{day} is keyed by UTC day in firestore.rules), report status
 * transitions (mirror validReportTransition()), chart scale and broadcast
 * read state. No Firebase imports, so everything here is unit-testable.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Day buckets
// ---------------------------------------------------------------------------

export interface DayBucket {
  /** "YYYY-MM-DD" (UTC). */
  key: string;
  /** Inclusive start, ISO 8601. */
  startIso: string;
  /** Exclusive end, ISO 8601. */
  endIso: string;
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The last `days` UTC days ending with today, oldest first. */
export function lastUtcDays(days: number, now: Date = new Date()): DayBucket[] {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const start = todayStart - (days - 1 - i) * DAY_MS;
    return {
      key: utcDayKey(new Date(start)),
      startIso: new Date(start).toISOString(),
      endIso: new Date(start + DAY_MS).toISOString(),
    };
  });
}

export function summarize(values: readonly number[]): { total: number; average: number } {
  const total = values.reduce((sum, v) => sum + v, 0);
  return { total, average: values.length === 0 ? 0 : total / values.length };
}

/** Smallest "nice" number (1, 2, 5 × 10ⁿ) ≥ `value`; at least 1. */
export function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

// ---------------------------------------------------------------------------
// Report statuses
// ---------------------------------------------------------------------------

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUSES as readonly string[]).includes(value);
}

export function isClosedStatus(status: ReportStatus): boolean {
  return status === 'resolved' || status === 'dismissed';
}

export function nextReportStatuses(from: ReportStatus): ReportStatus[] {
  if (isClosedStatus(from)) return ['reviewing'];
  return REPORT_STATUSES.filter((s) => s !== from);
}

export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  return nextReportStatuses(from).includes(to);
}

/** Pre-2026-10-11 resolutions carried { outcome: 'dismissed' | 'actioned' }. */
export function legacyReportStatus(outcome: string | null): ReportStatus {
  if (outcome === 'dismissed') return 'dismissed';
  if (outcome === 'actioned') return 'resolved';
  return 'open';
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type StaffRole = Exclude<UserRole, 'user'>;

export function isStaffRole(value: unknown): value is StaffRole {
  return value === 'moderator' || value === 'admin';
}

/** Mirrors the rules: admins change others' roles, never their own or the owner's. */
export function canEditRole(params: { actor: UserRole; isSelf: boolean; isOwner: boolean }): boolean {
  return params.actor === 'admin' && !params.isSelf && !params.isOwner;
}

/** Staff block ordinary users; only admins may block other staff; nobody blocks themselves. */
export function canBlockUser(params: {
  actor: UserRole;
  target: UserRole;
  isSelf: boolean;
  isOwner: boolean;
}): boolean {
  if (params.actor === 'user' || params.isSelf || params.isOwner) return false;
  return params.actor === 'admin' || params.target === 'user';
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export function isBroadcastUnread(createdAtMs: number, readAtMs: number | null): boolean {
  return readAtMs === null || createdAtMs > readAtMs;
}

/** Merges two newest-first lists into one newest-first list by ISO `createdAt`. */
export function mergeNewestFirst<A extends { createdAt: string }, B extends { createdAt: string }>(
  a: readonly A[],
  b: readonly B[],
): (A | B)[] {
  return [...a, ...b].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}
