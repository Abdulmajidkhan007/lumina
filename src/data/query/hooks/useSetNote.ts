import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Note } from '@/types/models';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Publishes/replaces the current user's note, then refreshes the notes strip. */
export function useSetNote() {
  const qc = useQueryClient();

  return useMutation<Note, Error, string>({
    mutationFn: (text) => messagesApi.setNote(text),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes() });
    },
  });
}
