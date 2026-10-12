/**
 * Report review flow — same model as web/src/lib/reports.ts: the filing never
 * changes; staff move `status` and append every step to
 * `reports/{id}/resolutions` (audit trail) plus `adminLogs`.
 */
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  canTransitionReport,
  isReportStatus,
  legacyReportStatus,
  type ReportStatus,
} from '@/utils/admin';
import { adminLogData, currentStaff, db, newAdminLogRef, serverTimestamp, str, toIso, type AdminAction } from './common';

export interface AdminReport {
  id: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export type TrailAction = 'status' | 'note' | 'hide_post' | 'ban_user' | 'legacy';

export interface TrailEntry {
  id: string;
  action: TrailAction;
  status: ReportStatus | null;
  note: string | null;
  moderator: string;
  createdAt: string | null;
}

const TARGETS: readonly AdminReport['targetType'][] = ['user', 'post', 'comment'];
const TRAIL_ACTIONS: readonly Exclude<TrailAction, 'legacy'>[] = ['status', 'note', 'hide_post', 'ban_user'];

function trail(reportId: string) {
  return db().collection('reports').doc(reportId).collection('resolutions');
}

function toReport(d: FirebaseFirestoreTypes.QueryDocumentSnapshot): AdminReport | null {
  const data = d.data();
  if (typeof data.createdAt !== 'string' || typeof data.targetId !== 'string') return null;
  return {
    id: d.id,
    reporterId: str(data.reporterId) ?? '',
    targetType: TARGETS.find((t) => t === data.targetType) ?? 'post',
    targetId: data.targetId,
    reason: str(data.reason) ?? '',
    status: isReportStatus(data.status) ? data.status : 'open',
    createdAt: data.createdAt,
  };
}

function addTrail(
  batch: FirebaseFirestoreTypes.WriteBatch,
  reportId: string,
  entry: { action: Exclude<TrailAction, 'legacy'>; status?: ReportStatus; note?: string },
  log: { action: AdminAction; targetType: 'user' | 'post' | 'report'; targetId: string },
): void {
  const me = currentStaff();
  const note = entry.note?.trim();
  batch.set(trail(reportId).doc(), {
    action: entry.action,
    ...(entry.status ? { status: entry.status } : {}),
    ...(note ? { note: note.slice(0, 1000) } : {}),
    moderatorId: me.uid,
    ...(me.email ? { moderatorEmail: me.email } : {}),
    createdAt: serverTimestamp(),
  });
  batch.set(newAdminLogRef(), adminLogData({ ...log, note: note ?? entry.status }));
}

/** Persists a closed status for legacy reports that carry an old { outcome }. */
async function backfillLegacy(docs: FirebaseFirestoreTypes.QueryDocumentSnapshot[], reports: AdminReport[]) {
  const me = currentStaff();
  await Promise.all(
    docs
      .filter((d) => !isReportStatus(d.data().status))
      .map(async (d) => {
        const snap = await trail(d.id).limit(1).get();
        const status = legacyReportStatus(str(snap.docs[0]?.data().outcome));
        if (status === 'open') return;
        await d.ref.update({ status, updatedBy: me.uid, updatedAt: serverTimestamp() });
        const report = reports.find((r) => r.id === d.id);
        if (report) report.status = status;
      }),
  ).catch((error: unknown) => console.warn('[admin] legacy report backfill failed', error));
}

export async function fetchReports(max = 100): Promise<AdminReport[]> {
  const snap = await db().collection('reports').orderBy('createdAt', 'desc').limit(max).get();
  const reports = snap.docs.map(toReport).filter((r): r is AdminReport => r !== null);
  await backfillLegacy(snap.docs, reports);
  return reports;
}

export async function fetchReportTrail(reportId: string): Promise<TrailEntry[]> {
  const snap = await trail(reportId).get();
  return snap.docs
    .map((d): TrailEntry => {
      const data = d.data();
      const legacy = str(data.outcome);
      return {
        id: d.id,
        action: legacy ? 'legacy' : TRAIL_ACTIONS.find((a) => a === data.action) ?? 'note',
        status: legacy ? legacyReportStatus(legacy) : isReportStatus(data.status) ? data.status : null,
        note: str(data.note),
        moderator: str(data.moderatorEmail) ?? str(data.moderatorId) ?? '',
        createdAt: toIso(data.createdAt),
      };
    })
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

export async function setReportStatus(report: AdminReport, to: ReportStatus, note?: string): Promise<void> {
  if (!canTransitionReport(report.status, to)) {
    throw new Error(`Cannot move a report from ${report.status} to ${to}.`);
  }
  const me = currentStaff();
  const batch = db().batch();
  batch.update(db().collection('reports').doc(report.id), {
    status: to,
    updatedBy: me.uid,
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
  const batch = db().batch();
  addTrail(batch, reportId, { action: 'note', note }, { action: 'report_note', targetType: 'report', targetId: reportId });
  await batch.commit();
}

/** Hides the post from feeds (staff-only fields) and removes its reel copy. */
export async function hideReportedPost(report: AdminReport, note?: string): Promise<void> {
  if (report.targetType !== 'post') throw new Error('Only post reports can hide a post.');
  const me = currentStaff();
  const batch = db().batch();
  batch.update(db().collection('posts').doc(report.targetId), {
    hidden: true,
    hiddenBy: me.uid,
    hiddenAt: serverTimestamp(),
    hiddenReason: (note?.trim() || report.reason).slice(0, 500),
  });
  batch.delete(db().collection('reels').doc(report.targetId));
  addTrail(batch, report.id, { action: 'hide_post', note }, { action: 'hide_post', targetType: 'post', targetId: report.targetId });
  await batch.commit();
}

export async function resolveReportedUserId(report: AdminReport): Promise<string | null> {
  if (report.targetType === 'user') return report.targetId;
  if (report.targetType !== 'post') return null;
  const snap = await db().collection('posts').doc(report.targetId).get();
  return str(snap.data()?.authorId);
}

export async function banReportedUser(report: AdminReport, uid: string, note?: string): Promise<void> {
  const me = currentStaff();
  if (me.uid === uid) throw new Error('You cannot block yourself.');
  const reason = (note?.trim() || report.reason || 'Reported').slice(0, 500);
  const batch = db().batch();
  batch.set(db().collection('userBans').doc(uid), {
    reason,
    bannedBy: me.uid,
    createdAt: serverTimestamp(),
    reportId: report.id,
  });
  addTrail(batch, report.id, { action: 'ban_user', note: reason }, { action: 'ban_user', targetType: 'user', targetId: uid });
  await batch.commit();
}
