import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/** Deletes one of the current user's highlights and refreshes their row. */
export function useDeleteHighlight() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<void, Error, string>({
    mutationFn: (id) => storiesApi.deleteHighlight(id),
    onSuccess: () => {
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.highlights(currentUser.id) });
      }
    },
  });
}
