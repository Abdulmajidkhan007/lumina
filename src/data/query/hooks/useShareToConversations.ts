/**
 * useShareToConversations
 *
 * Wraps `messagesApi.sharePostToConversations` — shares a post into one or
 * more conversations at once (PostDetail's "Share to..." sheet). No
 * optimistic state: the target threads are usually not open while sharing,
 * so there's nothing worth rendering ahead of the server round-trip. On
 * success, invalidates the conversations list (lastMessage previews changed)
 * and every affected thread's message page (in case it *is* open).
 *
 * Not exported from `./index` — screens import it directly by path, per the
 * data-layer task boundaries for this feature.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConversationId, PostId } from '@/types/models';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export type ShareToConversationsInput = {
  postId: PostId;
  conversationIds: ConversationId[];
};

export function useShareToConversations() {
  const qc = useQueryClient();

  return useMutation<void, Error, ShareToConversationsInput>({
    mutationFn: ({ postId, conversationIds }) =>
      messagesApi.sharePostToConversations(postId, conversationIds),

    onSuccess: (_data, { conversationIds }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.conversations() });
      for (const conversationId of conversationIds) {
        void qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      }
    },
  });
}
