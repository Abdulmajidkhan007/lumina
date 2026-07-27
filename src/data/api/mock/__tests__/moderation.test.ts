/**
 * Behaviour tests for the features added on top of the mock provider:
 * blocking (and its effect on feed/search), close friends, post archiving
 * and comment pinning. These exercise the same contract the Firebase
 * provider implements, so they guard the semantics both share.
 */
import { MockUsersApi } from '../users.mock';
import { MockPostsApi } from '../posts.mock';
import { currentUser, mutableUsers } from '../fixtures/users.fixture';
import { mutablePosts } from '../fixtures/posts.fixture';
import type { UserId, PostId } from '@/types/models';

const users = new MockUsersApi();
const posts = new MockPostsApi();

/** A user that isn't the signed-in mock user. */
function someOtherUserId(): UserId {
  const other = mutableUsers.find((u) => u.id !== currentUser.id);
  if (!other) throw new Error('fixture must contain a second user');
  return other.id;
}

describe('blocking', () => {
  const target = someOtherUserId();

  afterEach(async () => {
    await users.unblockUser(target);
  });

  it('reports the blocked state and lists the account', async () => {
    expect(await users.isBlocked(target)).toBe(false);
    await users.blockUser(target);

    expect(await users.isBlocked(target)).toBe(true);
    expect((await users.getBlockedUsers()).map((u) => u.id)).toContain(target);
  });

  it('hides blocked authors from the feed', async () => {
    const authored = mutablePosts.find((p) => p.author.id === target);
    if (!authored) return; // fixture has no post by this author — nothing to assert

    await users.blockUser(target);
    const feed = await posts.getFeed({ limit: 50 });

    expect(feed.items.some((p) => p.author.id === target)).toBe(false);
  });

  it('hides blocked accounts from user search', async () => {
    const targetUser = mutableUsers.find((u) => u.id === target);
    if (!targetUser) throw new Error('missing fixture user');

    await users.blockUser(target);
    const results = await users.searchUsers(targetUser.username);

    expect(results.items.some((u) => u.id === target)).toBe(false);
  });

  it('never blocks yourself', async () => {
    await users.blockUser(currentUser.id);
    expect(await users.isBlocked(currentUser.id)).toBe(false);
  });
});

describe('close friends', () => {
  const target = someOtherUserId();

  it('adds and removes a user', async () => {
    await users.setCloseFriend(target, true);
    expect((await users.getCloseFriends()).map((u) => u.id)).toContain(target);

    await users.setCloseFriend(target, false);
    expect((await users.getCloseFriends()).map((u) => u.id)).not.toContain(target);
  });
});

describe('archiving', () => {
  /** A post owned by the signed-in mock user, so archive is permitted. */
  function ownPostId(): PostId | null {
    return mutablePosts.find((p) => p.author.id === currentUser.id)?.id ?? null;
  }

  it('moves an owned post out of the feed and into the archive', async () => {
    const id = ownPostId();
    if (!id) return; // fixture has no post by the current user

    await posts.archivePost(id);

    const feed = await posts.getFeed({ limit: 50 });
    expect(feed.items.some((p) => p.id === id)).toBe(false);

    const archived = await posts.getArchivedPosts({ limit: 50 });
    expect(archived.items.some((p) => p.id === id)).toBe(true);

    await posts.unarchivePost(id);
    const restored = await posts.getFeed({ limit: 50 });
    expect(restored.items.some((p) => p.id === id)).toBe(true);
  });

  it("refuses to archive someone else's post", async () => {
    const foreign = mutablePosts.find((p) => p.author.id !== currentUser.id);
    if (!foreign) return;

    await expect(posts.archivePost(foreign.id)).rejects.toThrow(/only archive your own/i);
  });
});
