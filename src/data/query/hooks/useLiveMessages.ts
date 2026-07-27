import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { ConversationId } from '@/types/models';
import type { Paginated } from '@/types/api';
import type { MessageWithSharedPost } from '@/data/api/contracts';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/**
 * Keeps an open conversation live: subscribes to the provider's realtime
 * message stream and replaces the FIRST page of the infinite query with the
 * pushed messages, so new messages appear without a refetch. Older pages
 * (loaded by scrolling up) are left untouched.
 *
 * Providers without realtime (the mock) return a no-op unsubscribe, so this
 * is safe to mount unconditionally.
 */
export function useLiveMessages(conversationId: ConversationId): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const queryKey = queryKeys.messages(conversationId);

    const unsubscribe = messagesApi.subscribeToMessages(conversationId, (messages) => {
      qc.setQueryData<InfiniteData<Paginated<MessageWithSharedPost>>>(queryKey, (existing) => {
        const firstPage = existing?.pages[0];
        if (!existing || !firstPage) {
          return {
            pages: [{ items: messages, nextCursor: null }],
            pageParams: [undefined],
          };
        }
        return {
          ...existing,
          pages: [
            { items: messages, nextCursor: firstPage.nextCursor },
            ...existing.pages.slice(1),
          ],
        };
      });
    });

    return unsubscribe;
  }, [conversationId, qc]);
}
