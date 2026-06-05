import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginInput } from '@/types/forms';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}
