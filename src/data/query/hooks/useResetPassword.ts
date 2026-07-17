import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api/client';

/**
 * Sends a password-reset email for the given address. No cache invalidation
 * needed — this doesn't change any locally-cached state, it just triggers a
 * one-off backend side effect (an email being sent).
 */
export function useResetPassword() {
  return useMutation<void, Error, string>({
    mutationFn: (email) => authApi.resetPassword(email),
  });
}
