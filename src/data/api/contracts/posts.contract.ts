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
  /** Ids of people tagged in the post. */
  taggedUserIds?: UserId[];
  /** Ids of invited co-authors ("collab"). */
  collaboratorIds?: UserId[];
};

// ---------------------------------------------------------------------------
// IPostsApi — the swap boundary for posts and comments
// ---------------------------------------------------------------------------

export interface IPostsApi {
  getFeed(params: FeedParams): Promise<Paginated<Post>>;
  /** Pages posts tagged with `tag` (case-insensitive, without the leading `#`), newest first. */
  getPostsByHashtag(tag: string, params: FeedParams): Promise<Paginated<Post>>;
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
  /** Pins a comment to the top of a post's thread. Only the post author may pin. */
  pinComment(postId: PostId, commentId: CommentId): Promise<void>;
  /** Removes the pin from a previously pinned comment. */
  unpinComment(postId: PostId, commentId: CommentId): Promise<void>;
  getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>>;
  /** Permanently deletes a post. Callers must own the post — implementations verify authorship. */
  deletePost(id: PostId): Promise<void>;
  /** Hides a post from the feed/grid without deleting it. Owner-only. */
  archivePost(id: PostId): Promise<void>;
  /** Restores an archived post back to the feed/grid. Owner-only. */
  unarchivePost(id: PostId): Promise<void>;
  /** Pages the current user's archived posts, most recently archived first. */
  getArchivedPosts(params: FeedParams): Promise<Paginated<Post>>;
  /** Pages through the current user's saved posts, most recently saved first. */
  getSavedPosts(params: FeedParams): Promise<Paginated<Post>>;
}
