/**
 * Moderation hooks — block / unblock / restrict / report.
 *
 * Blocking a user hides their content everywhere, so a successful block
 * invalidates the feed, explore, and search caches in addition to the
 * blocked-users list.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { UserSummary, UserId } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useBlockedUsers(): UseQueryResult<UserSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.blockedUsers(),
    queryFn: () => usersApi.getBlockedUsers(),
  });
}

export function useSetBlocked() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: UserId; block: boolean }>({
    mutationFn: ({ id, block }) => (block ? usersApi.blockUser(id) : usersApi.unblockUser(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.blockedUsers() });
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
      void qc.invalidateQueries({ queryKey: queryKeys.explore() });
    },
  });
}

export function useRestrictedUsers(): UseQueryResult<UserSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.restrictedUsers(),
    queryFn: () => usersApi.getRestrictedUsers(),
  });
}

export function useSetRestricted() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: UserId; restricted: boolean }>({
    mutationFn: ({ id, restricted }) => usersApi.setRestricted(id, restricted),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.restrictedUsers() });
    },
  });
}

export function useReportContent() {
  return useMutation<
    void,
    Error,
    { targetType: 'user' | 'post' | 'comment'; targetId: string; reason?: string }
  >({
    mutationFn: (input) => usersApi.reportContent(input),
  });
}
