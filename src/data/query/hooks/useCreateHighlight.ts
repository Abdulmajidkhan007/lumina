import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Highlight } from '@/types/models';
import type { CreateHighlightInput } from '@/data/api/contracts';
import { storiesApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/** Creates a highlight owned by the current user and refreshes their row. */
export function useCreateHighlight() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<Highlight, Error, CreateHighlightInput>({
    mutationFn: (input) => storiesApi.createHighlight(input),
    onSuccess: () => {
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.highlights(currentUser.id) });
      }
    },
  });
}
