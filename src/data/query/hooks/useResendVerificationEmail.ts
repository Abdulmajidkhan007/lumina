import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api/client';

/**
 * Re-sends the signed-in user's email verification link. No cache
 * invalidation needed — it's a one-off backend side effect (an email being
 * sent), not a change to any locally-cached data.
 */
export function useResendVerificationEmail() {
  return useMutation<void, Error, void>({
    mutationFn: () => authApi.resendVerificationEmail(),
  });
}
