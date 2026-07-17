import type { Post, Comment , PostId, CommentId, UserId } from '@/types/models';
import type { Paginated, FeedParams, CommentParams } from '@/types/api';

// ---------------------------------------------------------------------------
// Request types scoped to posts
// ---------------------------------------------------------------------------

export type AddCommentInput = {
  postId: PostId;
  text: string;
  parentCommentId?: CommentId;
};

export type CreatePostMediaInput = {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number;
};

export type CreatePostInput = {
  media: CreatePostMediaInput[];
  caption: string;
  location?: string;
};

// ---------------------------------------------------------------------------
// IPostsApi — the swap boundary for posts and comments
// ---------------------------------------------------------------------------

export interface IPostsApi {
  getFeed(params: FeedParams): Promise<Paginated<Post>>;
  getPost(id: PostId): Promise<Post>;
  createPost(input: CreatePostInput): Promise<Post>;
  likePost(id: PostId): Promise<void>;
  unlikePost(id: PostId): Promise<void>;
  savePost(id: PostId): Promise<void>;
  unsavePost(id: PostId): Promise<void>;
  getComments(params: CommentParams): Promise<Paginated<Comment>>;
  addComment(input: AddCommentInput): Promise<Comment>;
  likeComment(postId: PostId, commentId: CommentId): Promise<void>;
  unlikeComment(postId: PostId, commentId: CommentId): Promise<void>;
  getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>>;
  /** Permanently deletes a post. Callers must own the post — implementations verify authorship. */
  deletePost(id: PostId): Promise<void>;
  /** Pages through the current user's saved posts, most recently saved first. */
  getSavedPosts(params: FeedParams): Promise<Paginated<Post>>;
}
