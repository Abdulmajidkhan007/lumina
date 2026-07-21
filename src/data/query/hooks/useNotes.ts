import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Note } from '@/types/models';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/** Notes shown atop the Direct inbox — own note first, then followed users'. */
export function useNotes(): UseQueryResult<Note[], Error> {
  return useQuery({
    queryKey: queryKeys.notes(),
    queryFn: () => messagesApi.getNotes(),
  });
}
