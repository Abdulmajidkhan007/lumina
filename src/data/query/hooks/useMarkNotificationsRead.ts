import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Notification } from '@/types/models';
import type { Paginated } from '@/types/api';
import { notificationsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type MarkReadSnapshot = {
  notifPages: InfiniteData<Paginated<Notification>> | undefined;
};

export function useMarkNotificationsRead() {
  const qc = useQueryClient();

  return useMutation<void, Error, void, MarkReadSnapshot>({
    mutationFn: () => notificationsApi.markAllRead(),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications() });

      const notifPages =
        qc.getQueryData<InfiniteData<Paginated<Notification>>>(
          queryKeys.notifications(),
        );

      if (notifPages) {
        qc.setQueryData<InfiniteData<Paginated<Notification>>>(
          queryKeys.notifications(),
          {
            ...notifPages,
            pages: notifPages.pages.map((page) => ({
              ...page,
              items: page.items.map((n) => ({ ...n, read: true })),
            })),
          },
        );
      }

      return { notifPages };
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot?.notifPages !== undefined) {
        qc.setQueryData<InfiniteData<Paginated<Notification>>>(
          queryKeys.notifications(),
          snapshot.notifPages,
        );
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
