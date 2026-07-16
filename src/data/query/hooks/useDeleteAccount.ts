import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/data/api/client';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Permanently deletes the signed-in user's account (Play Store / App Store
 * in-app account deletion requirement).
 *
 * On success the local auth session is cleared and the entire query cache
 * is wiped — every cached screen was scoped to a now-deleted account, so
 * there is nothing worth keeping around (unlike a targeted invalidation).
 */
export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authApi.deleteAccount(),

    onSuccess: () => {
      useAuthStore.getState().clearSession();
      qc.clear();
    },
  });
}
