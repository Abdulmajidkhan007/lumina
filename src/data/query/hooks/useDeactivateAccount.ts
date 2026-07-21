import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/data/api/client';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Temporarily deactivates the account and clears the local session + cache.
 * Signing back in reactivates it (see FirebaseAuthApi.fetchOrCreateProfile).
 */
export function useDeactivateAccount() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authApi.deactivateAccount(),
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      qc.clear();
    },
  });
}
