import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import type { Paginated } from '@/types/api';

const mockLikePost = jest.fn<Promise<void>, [string]>();
const mockUnlikePost = jest.fn<Promise<void>, [string]>();
const mockLikeReel = jest.fn<Promise<void>, [string]>();

jest.mock('@/data/api/client', () => ({
  postsApi: {
    likePost: (id: string) => mockLikePost(id),
    unlikePost: (id: string) => mockUnlikePost(id),
  },
  reelsApi: {
    likeReel: (id: string) => mockLikeReel(id),
    unlikeReel: jest.fn(),
  },
}));

import { useLikePost } from '../../hooks/useLikePost';
import { useLikeReel } from '../../hooks/useLikeReel';

type Item = { id: string; postId?: string; isLikedByMe: boolean; likeCount: number };
const pages = (items: Item[]): InfiniteData<Paginated<Item>> => ({
  pages: [{ items, nextCursor: null }],
  pageParams: [undefined],
});

const clients: QueryClient[] = [];

function setup() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  clients.push(qc);
  qc.setQueryData(['feed'], pages([{ id: 'p1', isLikedByMe: false, likeCount: 2 }]));
  qc.setQueryData(['reels'], pages([{ id: 'p1', postId: 'p1', isLikedByMe: false, likeCount: 2 }]));
  qc.setQueryData(['post', 'p1'], { id: 'p1', isLikedByMe: false, likeCount: 2 });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

const feedItem = (qc: QueryClient) => qc.getQueryData<InfiniteData<Paginated<Item>>>(['feed'])?.pages[0]?.items[0];
const reelItem = (qc: QueryClient) => qc.getQueryData<InfiniteData<Paginated<Item>>>(['reels'])?.pages[0]?.items[0];

afterEach(() => {
  jest.clearAllMocks();
  for (const qc of clients.splice(0)) qc.clear();
});

it('a like in Reels shows in the feed and post detail (post twin)', async () => {
  mockLikePost.mockResolvedValue();
  const { qc, wrapper } = setup();
  const { result } = renderHook(() => useLikeReel(), { wrapper });

  await act(async () => {
    result.current.mutate({ reelId: 'p1' as never, postId: 'p1' as never, liked: true });
  });

  await waitFor(() => expect(mockLikePost).toHaveBeenCalledWith('p1'));
  expect(mockLikeReel).not.toHaveBeenCalled();
  expect(feedItem(qc)).toMatchObject({ isLikedByMe: true, likeCount: 3 });
  expect(reelItem(qc)).toMatchObject({ isLikedByMe: true, likeCount: 3 });
});

it('rolls every copy back when the write fails', async () => {
  mockLikePost.mockRejectedValue(new Error('offline'));
  const { qc, wrapper } = setup();
  const { result } = renderHook(() => useLikePost(), { wrapper });

  await act(async () => {
    result.current.mutate({ postId: 'p1' as never, liked: true });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(feedItem(qc)).toMatchObject({ isLikedByMe: false, likeCount: 2 });
  expect(reelItem(qc)).toMatchObject({ isLikedByMe: false, likeCount: 2 });
});
