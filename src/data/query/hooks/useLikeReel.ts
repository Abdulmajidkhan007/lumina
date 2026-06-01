import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Reel } from '@/types/models';
import type { ReelId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { reelsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type LikeReelVariables = { reelId: ReelId; liked: boolean };

type LikeReelSnapshot = {
  reelPages: InfiniteData<Paginated<Reel>> | undefined;
};

function patchReelInFeed(
  data: InfiniteData<Paginated<Reel>>,
  reelId: ReelId,
  patch: Partial<Reel>,
): InfiniteData<Paginated<Reel>> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((r) =>
        r.id === reelId ? { ...r, ...patch } : r,
      ),
    })),
  };
}

export function useLikeReel() {
  const qc = useQueryClient();

  return useMutation<void, Error, LikeReelVariables, LikeReelSnapshot>({
    mutationFn: ({ reelId, liked }) =>
      liked ? reelsApi.likeReel(reelId) : reelsApi.unlikeReel(reelId),

    onMutate: async ({ reelId, liked }) => {
      await qc.cancelQueries({ queryKey: queryKeys.reels() });

      const reelPages =
        qc.getQueryData<InfiniteData<Paginated<Reel>>>(queryKeys.reels());

      if (reelPages) {
        // Find current likeCount to compute delta
        let currentLikeCount = 0;
        for (const page of reelPages.pages) {
          const found = page.items.find((r) => r.id === reelId);
          if (found) {
            currentLikeCount = found.likeCount;
            break;
          }
        }

        const patch: Partial<Reel> = {
          isLikedByMe: liked,
          likeCount: Math.max(0, currentLikeCount + (liked ? 1 : -1)),
        };

        qc.setQueryData<InfiniteData<Paginated<Reel>>>(
          queryKeys.reels(),
          patchReelInFeed(reelPages, reelId, patch),
        );
      }

      return { reelPages };
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot?.reelPages !== undefined) {
        qc.setQueryData<InfiniteData<Paginated<Reel>>>(
          queryKeys.reels(),
          snapshot.reelPages,
        );
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reels() });
    },
  });
}
