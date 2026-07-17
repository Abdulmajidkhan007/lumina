import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Signs the user in via Google. Mirrors `useLogin` — same session wiring,
 * just a different `mutationFn`.
 *
 * When the user backs out of the native account picker, `authApi.loginWithGoogle`
 * rejects with `Error('cancelled')`. That surfaces here as a normal
 * `isError` mutation state — callers (see `LoginScreen`/`SignupScreen`) check
 * `error.message !== 'cancelled'` before rendering an error banner, since a
 * cancelled picker isn't a failure worth alarming the user about.
 */
export function useGoogleLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: () => authApi.loginWithGoogle(),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}
