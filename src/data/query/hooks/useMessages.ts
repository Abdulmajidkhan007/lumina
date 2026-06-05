import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Message , ConversationId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useMessages(
  conversationId: ConversationId,
): UseInfiniteQueryResult<InfiniteData<Paginated<Message>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages({
        conversationId,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(conversationId),
  });
}
