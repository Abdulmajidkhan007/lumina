import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserId } from '@/types/models';
import { usersApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Adds/removes a user from the current user's Close Friends, then refreshes it. */
export function useSetCloseFriend() {
  const qc = useQueryClient();

  return useMutation<void, Error, { id: UserId; isCloseFriend: boolean }>({
    mutationFn: ({ id, isCloseFriend }) => usersApi.setCloseFriend(id, isCloseFriend),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.closeFriends() });
    },
  });
}
