/**
 * TanStack Query hooks for the in-app admin panel. Keys live here (not in
 * data/query/keys.ts) so the admin feature stays self-contained.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addReportNote,
  banReportedUser,
  banUser,
  deleteBroadcast,
  fetchAdminLogs,
  fetchBans,
  fetchDailySeries,
  fetchEmails,
  fetchOverviewTotals,
  fetchRecentBroadcasts,
  fetchReportTrail,
  fetchReports,
  fetchStaffRoles,
  hideReportedPost,
  publishBroadcast,
  resolveReportedUserId,
  searchUsers,
  setReportStatus,
  setUserRole,
  unbanUser,
  type AdminReport,
} from '@/data/services/admin';
import { fetchRecentActivity } from '@/data/services/activityLog';
import { fetchOwnRole } from '@/data/services/accountStatus';
import type { BroadcastFormValues } from '@/schemas/broadcast.schema';
import type { ReportStatus, UserRole } from '@/utils/admin';

export const adminKeys = {
  all: ['admin'] as const,
  ownRole: () => ['admin', 'ownRole'] as const,
  overview: (days: number) => ['admin', 'overview', days] as const,
  users: (term: string) => ['admin', 'users', term] as const,
  reports: () => ['admin', 'reports'] as const,
  trail: (reportId: string) => ['admin', 'reports', reportId, 'trail'] as const,
  journal: () => ['admin', 'journal'] as const,
  activity: () => ['admin', 'activity'] as const,
  broadcasts: () => ['admin', 'broadcasts'] as const,
};

/** Role of the signed-in user ('user' for everyone without staff access). */
export function useOwnRole() {
  return useQuery({ queryKey: adminKeys.ownRole(), queryFn: fetchOwnRole, staleTime: 5 * 60_000 });
}

export function useAdminOverview(days: number) {
  return useQuery({
    queryKey: adminKeys.overview(days),
    queryFn: async () => {
      const [totals, series] = await Promise.all([fetchOverviewTotals(), fetchDailySeries(days)]);
      return { totals, series };
    },
    staleTime: 60_000,
  });
}

export function useAdminUsers(term: string) {
  return useQuery({
    queryKey: adminKeys.users(term),
    queryFn: async () => {
      const [users, roles, bans] = await Promise.all([searchUsers(term), fetchStaffRoles(), fetchBans()]);
      const emails = await fetchEmails(users.map((u) => u.id)).catch(() => new Map<string, string>());
      return { users, roles, bans, emails };
    },
  });
}

export function useAdminReports() {
  return useQuery({ queryKey: adminKeys.reports(), queryFn: () => fetchReports() });
}

export function useReportTrail(reportId: string) {
  return useQuery({ queryKey: adminKeys.trail(reportId), queryFn: () => fetchReportTrail(reportId) });
}

export function useAdminJournal() {
  return useQuery({ queryKey: adminKeys.journal(), queryFn: () => fetchAdminLogs() });
}

export function useUserActivity() {
  return useQuery({ queryKey: adminKeys.activity(), queryFn: () => fetchRecentActivity() });
}

export function useRecentBroadcasts() {
  return useQuery({ queryKey: adminKeys.broadcasts(), queryFn: () => fetchRecentBroadcasts() });
}

/** Invalidates every admin query after a write — lists are small. */
function useAdminMutation<TVars>(mutationFn: (vars: TVars) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation<void, Error, TVars>({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useSetUserRole() {
  return useAdminMutation(({ uid, role }: { uid: string; role: UserRole }) => setUserRole(uid, role));
}

export function useBanUser() {
  return useAdminMutation(({ uid, reason }: { uid: string; reason: string }) => banUser(uid, reason));
}

export function useUnbanUser() {
  return useAdminMutation((uid: string) => unbanUser(uid));
}

export type ReportAction =
  | { kind: 'status'; to: ReportStatus; note: string }
  | { kind: 'note'; note: string }
  | { kind: 'hide_post'; note: string }
  | { kind: 'ban_user'; note: string };

export function useReportAction(report: AdminReport) {
  return useAdminMutation(async (action: ReportAction) => {
    switch (action.kind) {
      case 'status':
        return setReportStatus(report, action.to, action.note);
      case 'note':
        return addReportNote(report.id, action.note);
      case 'hide_post':
        return hideReportedPost(report, action.note);
      case 'ban_user': {
        const uid = await resolveReportedUserId(report);
        if (!uid) throw new Error('Could not find the reported account.');
        return banReportedUser(report, uid, action.note);
      }
    }
  });
}

export function usePublishBroadcast() {
  return useAdminMutation((values: BroadcastFormValues) => publishBroadcast(values));
}

export function useDeleteBroadcast() {
  return useAdminMutation((id: string) => deleteBroadcast(id));
}
