/**
 * `reports` collection (admin moderation queue).
 *
 * Written by any signed-in user via the mobile app's report action; readable
 * by staff (see `firestore.rules`). The filing never changes: staff only
 * move `status` (open → reviewing → resolved | dismissed, or reopen), and
 * every step — status change, note, hidden post, blocked user — is appended
 * to `reports/{id}/resolutions` (the audit trail) and to `adminLogs`.
 */
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { adminLogData, adminLogsCollection, type AdminAction } from './admin/adminLog';
import { timestampToIso } from './admin/firestoreTime';
import { canTransition, isReportStatus, legacyStatus, type ReportStatus } from './admin/reportStatus';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type TrailAction = 'status' | 'note' | 'hide_post' | 'ban_user' | 'legacy';

export interface TrailEntry {
  id: string;
  action: TrailAction;
  status: ReportStatus | null;
  note: string | null;
  moderatorId: string;
  moderatorEmail: string | null;
  createdAt: string | null;
}

const TARGET_TYPES: readonly Report['targetType'][] = ['user', 'post', 'comment'];

function toReport(d: QueryDocumentSnapshot<DocumentData>): Report | null {
  const data = d.data();
  if (typeof data.createdAt !== 'string' || typeof data.targetId !== 'string') return null;
  const targetType = TARGET_TYPES.find((t) => t === data.targetType) ?? 'post';
  return {
    id: d.id,
    reporterId: typeof data.reporterId === 'string' ? data.reporterId : '',
    targetType,
    targetId: data.targetId,
    reason: typeof data.reason === 'string' ? data.reason : '',
    status: isReportStatus(data.status) ? data.status : 'open',
    createdAt: data.createdAt,
    updatedAt: timestampToIso(data.updatedAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
  };
}

function resolutions(reportId: string) {
  return collection(db, 'reports', reportId, 'resolutions');
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

/** Appends an audit entry + admin journal entry to `batch`. */
function addTrail(
  batch: WriteBatch,
  reportId: string,
  entry: { action: Exclude<TrailAction, 'legacy'>; status?: ReportStatus; note?: string },
  log: { action: AdminAction; targetType: 'user' | 'post' | 'report'; targetId: string },
): void {
  const user = requireUser();
  const note = entry.note?.trim();
  batch.set(doc(resolutions(reportId)), {
    action: entry.action,
    ...(entry.status ? { status: entry.status } : {}),
    ...(note ? { note: note.slice(0, 1000) } : {}),
    moderatorId: user.uid,
    ...(user.email ? { moderatorEmail: user.email } : {}),
    createdAt: serverTimestamp(),
  });
  batch.set(doc(adminLogsCollection()), adminLogData({ ...log, note: note ?? entry.status }));
}

/**
 * Reports filed before statuses existed have no `status`. If one carries a
 * legacy resolution ({ outcome }), persist the matching closed status once
 * so counts and filters see it. Best-effort; failures leave it "open".
 */
async function backfillLegacyStatuses(rawDocs: QueryDocumentSnapshot<DocumentData>[], reports: Report[]) {
  const legacy = rawDocs.filter((d) => !isReportStatus(d.data().status));
  await Promise.all(
    legacy.map(async (d) => {
      const snap = await getDocs(query(resolutions(d.id), limit(1)));
      const outcome: unknown = snap.docs[0]?.data().outcome;
      const status = legacyStatus(typeof outcome === 'string' ? outcome : null);
      if (status === 'open') return;
      await updateDoc(d.ref, { status, updatedBy: requireUser().uid, updatedAt: serverTimestamp() });
      const report = reports.find((r) => r.id === d.id);
      if (report) report.status = status;
    }),
  ).catch((error: unknown) => console.warn('[reports] legacy backfill failed', error));
}

export async function fetchReports(): Promise<Report[]> {
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100)));
  const reports = snap.docs.map(toReport).filter((r): r is Report => r !== null);
  await backfillLegacyStatuses(snap.docs, reports);
  return reports;
}

export async function fetchReportTrail(reportId: string): Promise<TrailEntry[]> {
  const snap = await getDocs(resolutions(reportId));
  const entries = snap.docs.map((d): TrailEntry => {
    const data = d.data();
    const isLegacy = typeof data.outcome === 'string';
    const action: TrailAction = isLegacy
      ? 'legacy'
      : (['status', 'note', 'hide_post', 'ban_user'] as const).find((a) => a === data.action) ?? 'note';
    return {
      id: d.id,
      action,
      status: isLegacy
        ? legacyStatus(String(data.outcome))
        : isReportStatus(data.status)
          ? data.status
          : null,
      note: typeof data.note === 'string' ? data.note : null,
      moderatorId: typeof data.moderatorId === 'string' ? data.moderatorId : '',
      moderatorEmail: typeof data.moderatorEmail === 'string' ? data.moderatorEmail : null,
      createdAt: timestampToIso(data.createdAt),
    };
  });
  return entries.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

/** Moves a report to `to` (rules re-check the transition) with an optional note. */
export async function setReportStatus(report: Report, to: ReportStatus, note?: string): Promise<void> {
  if (!canTransition(report.status, to)) {
    throw new Error(`Cannot move a report from ${report.status} to ${to}.`);
  }
  const user = requireUser();
  const batch = writeBatch(db);
  batch.update(doc(db, 'reports', report.id), {
    status: to,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
  addTrail(batch, report.id, { action: 'status', status: to, note }, {
    action: 'report_status',
    targetType: 'report',
    targetId: report.id,
  });
  await batch.commit();
}

export async function addReportNote(reportId: string, note: string): Promise<void> {
  const batch = writeBatch(db);
  addTrail(batch, reportId, { action: 'note', note }, {
    action: 'report_note',
    targetType: 'report',
    targetId: reportId,
  });
  await batch.commit();
}

/**
 * Hides the reported post from feeds (staff-only `hidden` fields) and removes
 * its reel copy, if any. Unhiding is not offered here: the post stays in
 * Firestore and an admin can clear `hidden` in the console.
 */
export async function hideReportedPost(report: Report, note?: string): Promise<void> {
  if (report.targetType !== 'post') throw new Error('Only post reports can hide a post.');
  const user = requireUser();
  const batch = writeBatch(db);
  batch.update(doc(db, 'posts', report.targetId), {
    hidden: true,
    hiddenBy: user.uid,
    hiddenAt: serverTimestamp(),
    hiddenReason: (note?.trim() || report.reason).slice(0, 500),
  });
  batch.delete(doc(db, 'reels', report.targetId));
  addTrail(batch, report.id, { action: 'hide_post', note }, {
    action: 'hide_post',
    targetType: 'post',
    targetId: report.targetId,
  });
  await batch.commit();
}

/** The account a report is about: the user itself, or a post's author. */
export async function resolveReportedUserId(report: Report): Promise<string | null> {
  if (report.targetType === 'user') return report.targetId;
  if (report.targetType !== 'post') return null;
  const snap = await getDoc(doc(db, 'posts', report.targetId));
  const authorId: unknown = snap.data()?.authorId;
  return typeof authorId === 'string' ? authorId : null;
}

/** Blocks the reported account and records it on the report's trail. */
export async function banReportedUser(report: Report, uid: string, note?: string): Promise<void> {
  const user = requireUser();
  if (user.uid === uid) throw new Error('You cannot block yourself.');
  const reason = (note?.trim() || report.reason || 'Reported').slice(0, 500);
  const batch = writeBatch(db);
  batch.set(doc(db, 'userBans', uid), {
    reason,
    bannedBy: user.uid,
    createdAt: serverTimestamp(),
    reportId: report.id,
  });
  addTrail(batch, report.id, { action: 'ban_user', note: reason }, {
    action: 'ban_user',
    targetType: 'user',
    targetId: uid,
  });
  await batch.commit();
}
