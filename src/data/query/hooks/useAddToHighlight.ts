import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Highlight } from '@/types/models';
import type { HighlightMediaInput } from '@/data/api/contracts';
import { storiesApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

type AddToHighlightVariables = { highlightId: string; media: HighlightMediaInput[] };

/** Appends story media to one of the current user's highlights. */
export function useAddToHighlight() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<Highlight, Error, AddToHighlightVariables>({
    mutationFn: ({ highlightId, media }) => storiesApi.addToHighlight(highlightId, media),
    onSuccess: () => {
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.highlights(currentUser.id) });
      }
    },
  });
}
