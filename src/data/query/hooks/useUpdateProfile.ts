import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types/models';
import type { EditProfileInput } from '@/types/forms';
import { authApi } from '@/data/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { queryKeys } from '../keys';

export interface UpdateProfileVariables {
  input: EditProfileInput;
  avatarLocalUri?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation<User, Error, UpdateProfileVariables>({
    mutationFn: ({ input, avatarLocalUri }) => authApi.updateProfile(input, avatarLocalUri),

    onSuccess: (user) => {
      useAuthStore.getState().updateCurrentUser(user);
      void qc.invalidateQueries({ queryKey: queryKeys.user(user.id) });
    },
  });
}
