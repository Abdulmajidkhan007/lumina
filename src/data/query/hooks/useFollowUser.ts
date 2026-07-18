import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User , UserId } from '@/types/models';
import type { FollowRequestStatus } from '@/data/api/contracts';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';
import { followRequestStatusKey } from './useFollowRequests';

type FollowVariables = {
  userId: UserId;
  follow: boolean;
  /**
   * Whether the target profile is private. When following (`follow: true`)
   * a private profile, `usersApi.followUser` files a request instead of an
   * immediate follow — so the optimistic patch must NOT flip
   * `isFollowedByMe`/`followerCount` yet, only the follow-request-status
   * cache. Omit for public targets (defaults to an immediate follow/unfollow,
   * matching this hook's pre-follow-request behaviour).
   */
  targetIsPrivate?: boolean;
};

type FollowSnapshot = {
  userCache: User | undefined;
  statusCache: FollowRequestStatus | undefined;
};

export function useFollowUser() {
  const qc = useQueryClient();

  return useMutation<void, Error, FollowVariables, FollowSnapshot>({
    mutationFn: ({ userId, follow }) =>
      follow ? usersApi.followUser(userId) : usersApi.unfollowUser(userId),

    onMutate: async ({ userId, follow, targetIsPrivate }) => {
      await qc.cancelQueries({ queryKey: queryKeys.user(userId) });
      await qc.cancelQueries({ queryKey: followRequestStatusKey(userId) });

      const userCache = qc.getQueryData<User>(queryKeys.user(userId));
      const statusCache = qc.getQueryData<FollowRequestStatus>(followRequestStatusKey(userId));

      // Following a private target only files a request — the real follow
      // (and its counters) only exists once the target accepts it.
      const filesRequestOnly = follow && targetIsPrivate === true;

      if (userCache && !filesRequestOnly) {
        const patch: Partial<User> = {
          isFollowedByMe: follow,
          followerCount: Math.max(
            0,
            userCache.followerCount + (follow ? 1 : -1),
          ),
        };
        qc.setQueryData<User>(queryKeys.user(userId), { ...userCache, ...patch });
      }

      qc.setQueryData<FollowRequestStatus>(
        followRequestStatusKey(userId),
        filesRequestOnly ? 'requested' : follow ? 'following' : 'none',
      );

      return { userCache, statusCache };
    },

    onError: (_err, { userId }, snapshot) => {
      if (snapshot?.userCache !== undefined) {
        qc.setQueryData<User>(queryKeys.user(userId), snapshot.userCache);
      }
      if (snapshot?.statusCache !== undefined) {
        qc.setQueryData<FollowRequestStatus>(followRequestStatusKey(userId), snapshot.statusCache);
      }
    },

    onSettled: (_data, _err, { userId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.user(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.followers(userId) });
      void qc.invalidateQueries({ queryKey: followRequestStatusKey(userId) });
    },
  });
}
