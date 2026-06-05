import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User , UserId } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type FollowVariables = { userId: UserId; follow: boolean };

type FollowSnapshot = {
  userCache: User | undefined;
};

export function useFollowUser() {
  const qc = useQueryClient();

  return useMutation<void, Error, FollowVariables, FollowSnapshot>({
    mutationFn: ({ userId, follow }) =>
      follow ? usersApi.followUser(userId) : usersApi.unfollowUser(userId),

    onMutate: async ({ userId, follow }) => {
      await qc.cancelQueries({ queryKey: queryKeys.user(userId) });

      const userCache = qc.getQueryData<User>(queryKeys.user(userId));

      if (userCache) {
        const patch: Partial<User> = {
          isFollowedByMe: follow,
          followerCount: Math.max(
            0,
            userCache.followerCount + (follow ? 1 : -1),
          ),
        };
        qc.setQueryData<User>(queryKeys.user(userId), { ...userCache, ...patch });
      }

      return { userCache };
    },

    onError: (_err, { userId }, snapshot) => {
      if (snapshot?.userCache !== undefined) {
        qc.setQueryData<User>(queryKeys.user(userId), snapshot.userCache);
      }
    },

    onSettled: (_data, _err, { userId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.user(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.followers(userId) });
    },
  });
}
