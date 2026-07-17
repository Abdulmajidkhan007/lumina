import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/data/api/client';

export type ChangePasswordVariables = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Changes the signed-in user's password after verifying the current one.
 * No cache invalidation needed — this doesn't change any locally-cached
 * data, just a backend credential.
 */
export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordVariables>({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword(currentPassword, newPassword),
  });
}
