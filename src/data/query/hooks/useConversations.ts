import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Conversation } from '@/types/models';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useConversations(): UseQueryResult<Conversation[], Error> {
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: () => messagesApi.getConversations(),
  });
}
