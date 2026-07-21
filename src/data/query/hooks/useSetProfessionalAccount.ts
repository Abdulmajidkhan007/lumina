import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types/models';
import { authApi } from '@/data/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/** Switches the account between personal and professional, syncing the store. */
export function useSetProfessionalAccount() {
  const qc = useQueryClient();

  return useMutation<User, Error, boolean>({
    mutationFn: (enabled) => authApi.setProfessionalAccount(enabled),
    onSuccess: (user) => {
      useAuthStore.getState().updateCurrentUser(user);
      void qc.invalidateQueries({ queryKey: queryKeys.user(user.id) });
    },
  });
}
