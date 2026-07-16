import type { IPostsApi , AddCommentInput, CreatePostInput } from '@/data/api/contracts';
import type { Post, Comment , Media, PostId, UserId } from '@/types/models';
import type { Paginated, FeedParams, CommentParams } from '@/types/api';
import { commentIdSchema, postIdSchema } from '@/schemas';
import { mutablePosts } from './fixtures/posts.fixture';
import { mutableComments } from './fixtures/comments.fixture';
import { currentUser, toUserSummary } from './fixtures/users.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

export class MockPostsApi implements IPostsApi {
  async getFeed(params: FeedParams): Promise<Paginated<Post>> {
    await mockDelay();
    const filtered = params.userId
      ? mutablePosts.filter((p) => p.author.id === params.userId)
      : mutablePosts;
    return paginateArray(filtered, params.cursor, params.limit);
  }

  async getPost(id: PostId): Promise<Post> {
    await mockDelay();
    const post = mutablePosts.find((p) => p.id === id);
    if (!post) throw new Error(`Post ${id} not found`);
    return post;
  }

  async likePost(id: PostId): Promise<void> {
    await mockDelay();
    const post = mutablePosts.find((p) => p.id === id);
    if (post && !post.isLikedByMe) {
      post.isLikedByMe = true;
      post.likeCount += 1;
    }
  }

  async unlikePost(id: PostId): Promise<void> {
    await mockDelay();
    const post = mutablePosts.find((p) => p.id === id);
    if (post && post.isLikedByMe) {
      post.isLikedByMe = false;
      post.likeCount = Math.max(0, post.likeCount - 1);
    }
  }

  async savePost(id: PostId): Promise<void> {
    await mockDelay();
    const post = mutablePosts.find((p) => p.id === id);
    if (post) post.isSavedByMe = true;
  }

  async unsavePost(id: PostId): Promise<void> {
    await mockDelay();
    const post = mutablePosts.find((p) => p.id === id);
    if (post) post.isSavedByMe = false;
  }

  async getComments(params: CommentParams): Promise<Paginated<Comment>> {
    await mockDelay();
    const filtered = mutableComments.filter((c) => {
      if (c.postId !== params.postId) return false;
      if (params.parentCommentId) {
        return c.parentId === params.parentCommentId;
      }
      return c.parentId === undefined;
    });
    return paginateArray(filtered, params.cursor, params.limit);
  }

  async addComment(input: AddCommentInput): Promise<Comment> {
    await mockDelay();
    const newComment: Comment = {
      id: commentIdSchema.parse(`comment-live-${Date.now()}`),
      postId: input.postId,
      author: toUserSummary(currentUser),
      text: input.text,
      likeCount: 0,
      isLikedByMe: false,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      ...(input.parentCommentId !== undefined
        ? { parentId: input.parentCommentId }
        : {}),
    };
    mutableComments.push(newComment);
    const post = mutablePosts.find((p) => p.id === input.postId);
    if (post) post.commentCount += 1;
    return newComment;
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    await mockDelay();
    const media: Media[] = input.media.map((m) =>
      m.type === 'video'
        ? {
            type: 'video',
            uri: m.uri,
            width: m.width ?? 1080,
            height: m.height ?? 1080,
            ...(m.durationMs !== undefined ? { durationMs: m.durationMs } : {}),
          }
        : {
            type: 'image',
            uri: m.uri,
            width: m.width ?? 1080,
            height: m.height ?? 1080,
          },
    );
    const newPost: Post = {
      id: postIdSchema.parse(`post-live-${Date.now()}`),
      author: toUserSummary(currentUser),
      media,
      caption: input.caption.length > 0 ? input.caption : null,
      likeCount: 0,
      commentCount: 0,
      isLikedByMe: false,
      isSavedByMe: false,
      createdAt: new Date().toISOString(),
      ...(input.location !== undefined ? { location: input.location } : {}),
    };
    mutablePosts.unshift(newPost);
    return newPost;
  }

  async getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>> {
    await mockDelay();
    const filtered = mutablePosts.filter((p) => p.author.id === userId);
    return paginateArray(filtered, params.cursor, params.limit);
  }
}
