import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Removes the current user's active note, then refreshes the notes strip. */
export function useClearNote() {
  const qc = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => messagesApi.clearNote(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}
