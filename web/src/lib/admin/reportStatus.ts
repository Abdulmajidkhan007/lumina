/**
 * Report review states and allowed moves — mirrors validReportTransition()
 * in firestore.rules, so the UI only offers moves the rules accept.
 */

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUSES as readonly string[]).includes(value);
}

export function isClosed(status: ReportStatus): boolean {
  return status === 'resolved' || status === 'dismissed';
}

/** Statuses a report may move to from `from`. */
export function nextStatuses(from: ReportStatus): ReportStatus[] {
  if (isClosed(from)) return ['reviewing'];
  return REPORT_STATUSES.filter((s) => s !== from);
}

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return nextStatuses(from).includes(to);
}

/**
 * Status of a report filed before statuses existed: closed when a legacy
 * resolution exists ({ outcome: 'dismissed' | 'actioned' }), else open.
 */
export function legacyStatus(outcome: string | null): ReportStatus {
  if (outcome === 'dismissed') return 'dismissed';
  if (outcome === 'actioned') return 'resolved';
  return 'open';
}
