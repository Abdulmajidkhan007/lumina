import type { Post, Comment } from '@/types/models';
import type { PostId, CommentId, UserId } from '@/types/models';
import type { Paginated, FeedParams, CommentParams } from '@/types/api';

// ---------------------------------------------------------------------------
// Request types scoped to posts
// ---------------------------------------------------------------------------

export type AddCommentInput = {
  postId: PostId;
  text: string;
  parentCommentId?: CommentId;
};

// ---------------------------------------------------------------------------
// IPostsApi — the swap boundary for posts and comments
// ---------------------------------------------------------------------------

export interface IPostsApi {
  getFeed(params: FeedParams): Promise<Paginated<Post>>;
  getPost(id: PostId): Promise<Post>;
  likePost(id: PostId): Promise<void>;
  unlikePost(id: PostId): Promise<void>;
  savePost(id: PostId): Promise<void>;
  unsavePost(id: PostId): Promise<void>;
  getComments(params: CommentParams): Promise<Paginated<Comment>>;
  addComment(input: AddCommentInput): Promise<Comment>;
  getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>>;
}
