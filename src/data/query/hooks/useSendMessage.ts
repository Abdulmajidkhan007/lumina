import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Message, Conversation, MessagePreview, UserSummary } from '@/types/models';
import type { Paginated } from '@/types/api';
import type { SendMessageInput } from '@/data/api/contracts';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';
import { messageIdSchema, userIdSchema } from '@/schemas';

type SendMessageSnapshot = {
  messagesCache: InfiniteData<Paginated<Message>> | undefined;
  conversationsCache: Conversation[] | undefined;
};

/**
 * Hook to send a message with an optimistic update.
 *
 * Accepts an optional `currentUserSummary` so callers can pass the real
 * authenticated user (from useCurrentUser()) for a realistic optimistic
 * sender preview. Falls back to a placeholder if not provided.
 */
export function useSendMessage(currentUserSummary?: UserSummary) {
  const qc = useQueryClient();

  return useMutation<Message, Error, SendMessageInput, SendMessageSnapshot>({
    mutationFn: (input) => messagesApi.sendMessage(input),

    onMutate: async (input) => {
      const messagesKey = queryKeys.messages(input.conversationId);
      await qc.cancelQueries({ queryKey: messagesKey });
      await qc.cancelQueries({ queryKey: queryKeys.conversations() });

      const messagesCache =
        qc.getQueryData<InfiniteData<Paginated<Message>>>(messagesKey);
      const conversationsCache = qc.getQueryData<Conversation[]>(
        queryKeys.conversations(),
      );

      // Build an optimistic message — marked 'sending' until the server responds
      const optimisticMsg: Message = {
        id: messageIdSchema.parse(`msg-optimistic-${Date.now()}`),
        conversationId: input.conversationId,
        ...(currentUserSummary !== undefined
          ? { sender: currentUserSummary }
          : {
              sender: {
                id: userIdSchema.parse('user-000'),
                username: 'you',
                displayName: 'You',
                avatarUrl: null,
                isVerified: false,
              },
            }),
        text: input.text,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      // Prepend optimistic message to the top of the first page
      if (messagesCache) {
        const [firstPage, ...rest] = messagesCache.pages;
        if (firstPage) {
          qc.setQueryData<InfiniteData<Paginated<Message>>>(messagesKey, {
            ...messagesCache,
            pages: [
              { ...firstPage, items: [optimisticMsg, ...firstPage.items] },
              ...rest,
            ],
          });
        }
      }

      return { messagesCache, conversationsCache };
    },

    onError: (_err, input, snapshot) => {
      if (snapshot?.messagesCache !== undefined) {
        qc.setQueryData(
          queryKeys.messages(input.conversationId),
          snapshot.messagesCache,
        );
      }
      if (snapshot?.conversationsCache !== undefined) {
        qc.setQueryData(queryKeys.conversations(), snapshot.conversationsCache);
      }
    },

    onSuccess: (serverMessage, input) => {
      // Replace the optimistic placeholder with the confirmed server message
      const messagesKey = queryKeys.messages(input.conversationId);
      const current =
        qc.getQueryData<InfiniteData<Paginated<Message>>>(messagesKey);

      if (current) {
        qc.setQueryData<InfiniteData<Paginated<Message>>>(messagesKey, {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id.startsWith('msg-optimistic-') &&
              m.conversationId === input.conversationId
                ? serverMessage
                : m,
            ),
          })),
        });
      }

      // Sync the lastMessage preview on the conversations list
      const convs = qc.getQueryData<Conversation[]>(queryKeys.conversations());
      if (convs) {
        const preview: MessagePreview = {
          text: serverMessage.text,
          senderId: serverMessage.sender.id,
          createdAt: serverMessage.createdAt,
          status: 'sent',
        };
        qc.setQueryData<Conversation[]>(
          queryKeys.conversations(),
          convs.map((c) =>
            c.id === input.conversationId
              ? { ...c, lastMessage: preview, updatedAt: serverMessage.createdAt }
              : c,
          ),
        );
      }
    },

    onSettled: (_data, _err, input) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.messages(input.conversationId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
  });
}
