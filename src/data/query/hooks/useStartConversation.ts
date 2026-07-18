/**
 * useStartConversation
 *
 * Wraps `messagesApi.getOrCreateConversation` — the entry point for "message
 * this person" flows (new-conversation search, a user's profile "Message"
 * button). Idempotent server-side, so this mutation has no optimistic state
 * of its own; it just primes the `conversations` cache with the resolved
 * conversation on success so the thread screen (which reads participant info
 * from that cache) has it immediately.
 *
 * Not exported from `./index` — screens import it directly by path, per the
 * data-layer task boundaries for this feature.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation, UserId } from '@/types/models';
import { messagesApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useStartConversation() {
  const qc = useQueryClient();

  return useMutation<Conversation, Error, UserId>({
    mutationFn: (otherUserId) => messagesApi.getOrCreateConversation(otherUserId),

    onSuccess: (conversation) => {
      const existing = qc.getQueryData<Conversation[]>(queryKeys.conversations());
      if (existing) {
        const alreadyPresent = existing.some((c) => c.id === conversation.id);
        qc.setQueryData<Conversation[]>(
          queryKeys.conversations(),
          alreadyPresent
            ? existing.map((c) => (c.id === conversation.id ? conversation : c))
            : [conversation, ...existing],
        );
      }
      void qc.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
  });
}
