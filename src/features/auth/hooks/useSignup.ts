import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api';
import { useAuthStore } from '@/stores/auth.store';
import type { SignupInput } from '@/types/forms';

export function useSignup() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: SignupInput) => authApi.signup(input),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}
