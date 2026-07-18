/**
 * Lumina — Follow-request query hooks
 *
 * Covers the private-account follow-request lifecycle: reading the current
 * user's relationship to a profile (`useFollowRequestStatus`), listing
 * incoming requests (`useIncomingFollowRequests`), and the two terminal
 * actions the target side can take (`useAcceptFollowRequest` /
 * `useRejectFollowRequest`) plus the one the requester side can take
 * (`useCancelFollowRequest`).
 *
 * These query keys are deliberately NOT added to the shared `queryKeys`
 * factory in `../keys` (out of scope for this change) — they're exported
 * here instead so `useFollowUser` (which also needs to invalidate/patch
 * follow-request status after an immediate follow/unfollow) can import the
 * exact same tuple rather than hand-rolling a matching literal.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { UserSummary, UserId } from '@/types/models';
import type { Paginated } from '@/types/api';
import type { FollowRequestStatus } from '@/data/api/contracts';
import { usersApi } from '@/data/api/client';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const followRequestStatusKey = (id: UserId) => ['followRequestStatus', id] as const;
export const incomingFollowRequestsKey = () => ['followRequests', 'incoming'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** The current user's relationship to `id` — null `id` disables the query. */
export function useFollowRequestStatus(id: UserId | null): UseQueryResult<FollowRequestStatus, Error> {
  return useQuery({
    queryKey: followRequestStatusKey((id ?? '') as UserId),
    queryFn: () => usersApi.getFollowRequestStatus(id as UserId),
    enabled: id !== null,
  });
}

export function useIncomingFollowRequests(): UseInfiniteQueryResult<
  InfiniteData<Paginated<UserSummary>>,
  Error
> {
  return useInfiniteQuery({
    queryKey: incomingFollowRequestsKey(),
    queryFn: ({ pageParam }) =>
      usersApi.getIncomingFollowRequests({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Mutations — accept / reject an incoming request
// ---------------------------------------------------------------------------

type IncomingListSnapshot = {
  requestsPages: InfiniteData<Paginated<UserSummary>> | undefined;
};

function removeIncomingRequester(
  qc: ReturnType<typeof useQueryClient>,
  requesterId: UserId,
): InfiniteData<Paginated<UserSummary>> | undefined {
  const requestsPages = qc.getQueryData<InfiniteData<Paginated<UserSummary>>>(
    incomingFollowRequestsKey(),
  );
  if (requestsPages) {
    qc.setQueryData<InfiniteData<Paginated<UserSummary>>>(incomingFollowRequestsKey(), {
      ...requestsPages,
      pages: requestsPages.pages.map((page) => ({
        ...page,
        items: page.items.filter((u) => u.id !== requesterId),
      })),
    });
  }
  return requestsPages;
}

export function useAcceptFollowRequest(): UseMutationResult<
  void,
  Error,
  UserId,
  IncomingListSnapshot
> {
  const qc = useQueryClient();

  return useMutation<void, Error, UserId, IncomingListSnapshot>({
    mutationFn: (requesterId) => usersApi.acceptFollowRequest(requesterId),

    onMutate: async (requesterId) => {
      await qc.cancelQueries({ queryKey: incomingFollowRequestsKey() });
      return { requestsPages: removeIncomingRequester(qc, requesterId) };
    },

    onError: (_err, _requesterId, snapshot) => {
      if (snapshot?.requestsPages !== undefined) {
        qc.setQueryData(incomingFollowRequestsKey(), snapshot.requestsPages);
      }
    },

    onSettled: (_data, _err, requesterId) => {
      void qc.invalidateQueries({ queryKey: incomingFollowRequestsKey() });
      void qc.invalidateQueries({ queryKey: followRequestStatusKey(requesterId) });
    },
  });
}

export function useRejectFollowRequest(): UseMutationResult<
  void,
  Error,
  UserId,
  IncomingListSnapshot
> {
  const qc = useQueryClient();

  return useMutation<void, Error, UserId, IncomingListSnapshot>({
    mutationFn: (requesterId) => usersApi.rejectFollowRequest(requesterId),

    onMutate: async (requesterId) => {
      await qc.cancelQueries({ queryKey: incomingFollowRequestsKey() });
      return { requestsPages: removeIncomingRequester(qc, requesterId) };
    },

    onError: (_err, _requesterId, snapshot) => {
      if (snapshot?.requestsPages !== undefined) {
        qc.setQueryData(incomingFollowRequestsKey(), snapshot.requestsPages);
      }
    },

    onSettled: (_data, _err, requesterId) => {
      void qc.invalidateQueries({ queryKey: incomingFollowRequestsKey() });
      void qc.invalidateQueries({ queryKey: followRequestStatusKey(requesterId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation — the requester cancelling their own pending request
// ---------------------------------------------------------------------------

type StatusSnapshot = {
  statusCache: FollowRequestStatus | undefined;
};

export function useCancelFollowRequest(): UseMutationResult<void, Error, UserId, StatusSnapshot> {
  const qc = useQueryClient();

  return useMutation<void, Error, UserId, StatusSnapshot>({
    mutationFn: (targetId) => usersApi.cancelFollowRequest(targetId),

    onMutate: async (targetId) => {
      await qc.cancelQueries({ queryKey: followRequestStatusKey(targetId) });
      const statusCache = qc.getQueryData<FollowRequestStatus>(followRequestStatusKey(targetId));
      qc.setQueryData<FollowRequestStatus>(followRequestStatusKey(targetId), 'none');
      return { statusCache };
    },

    onError: (_err, targetId, snapshot) => {
      if (snapshot?.statusCache !== undefined) {
        qc.setQueryData(followRequestStatusKey(targetId), snapshot.statusCache);
      }
    },

    onSettled: (_data, _err, targetId) => {
      void qc.invalidateQueries({ queryKey: followRequestStatusKey(targetId) });
    },
  });
}
