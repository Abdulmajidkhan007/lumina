import { queryKeys } from '@/data/query/keys';
import { userIdSchema, postIdSchema, conversationIdSchema } from '@/schemas';

const userId = userIdSchema.parse('user-1');
const otherUserId = userIdSchema.parse('user-2');
const postId = postIdSchema.parse('post-1');
const conversationId = conversationIdSchema.parse('conv-1');

describe('queryKeys', () => {
  it('produces stable tuples for repeated calls with the same input', () => {
    expect(queryKeys.feedUser(userId)).toEqual(queryKeys.feedUser(userId));
    expect(queryKeys.post(postId)).toEqual(['post', postId]);
  });

  it('produces distinct tuples for different arguments', () => {
    expect(queryKeys.feedUser(userId)).not.toEqual(queryKeys.feedUser(otherUserId));
    expect(queryKeys.user(userId)).not.toEqual(queryKeys.followers(userId));
  });

  it('distinguishes the base feed key from a user-scoped feed key', () => {
    expect(queryKeys.feed()).toEqual(['feed']);
    expect(queryKeys.feedUser(userId)).toEqual(['feed', 'user', userId]);
    expect(queryKeys.feed()).not.toEqual(queryKeys.feedUser(userId));
  });

  it('builds distinct comment keys for top-level comments vs. replies', () => {
    const topLevel = queryKeys.comments(postId);
    const replies = queryKeys.comments(postId, 'comment-1');

    expect(topLevel).toEqual(['comments', postId]);
    expect(replies).toEqual(['comments', postId, 'replies', 'comment-1']);
    expect(topLevel).not.toEqual(replies);
  });

  it('builds distinct explore keys with and without a query', () => {
    expect(queryKeys.explore()).toEqual(['explore']);
    expect(queryKeys.explore('cats')).toEqual(['explore', 'cats']);
  });

  it('scopes messages by conversation id', () => {
    expect(queryKeys.messages(conversationId)).toEqual(['messages', conversationId]);
  });
});
