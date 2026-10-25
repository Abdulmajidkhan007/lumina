import { afterAll as after, beforeAll as before, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { seed, setup, summary } from '../helpers/env.js';

// Counters (followerCount, likeCount, ...) may only move by ±1 per write,
// and new docs start at zero — for everyone, including the doc's owner.
describe('counters ±1', () => {
  let env;
  before(async () => {
    env = await setup();
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seed(env, {
      'users/alice': { username: 'alice', followerCount: 5, followingCount: 2, postCount: 1 },
      'posts/p1': { authorId: 'alice', author: summary('alice'), caption: 'hi', likeCount: 3, commentCount: 0, shareCount: 0 },
      'reels/r1': { authorId: 'alice', author: summary('alice'), caption: 'hi', likeCount: 3, commentCount: 0, shareCount: 0 },
    });
  });

  const bob = () => env.authenticatedContext('bob').firestore();
  const alice = () => env.authenticatedContext('alice').firestore();

  it('another user bumps followerCount by +1 / -1', async () => {
    await assertSucceeds(bob().doc('users/alice').update({ followerCount: 6 }));
    await assertSucceeds(bob().doc('users/alice').update({ followerCount: 5 }));
  });

  it('another user cannot jump followerCount', async () => {
    await assertFails(bob().doc('users/alice').update({ followerCount: 1000 }));
    await assertFails(bob().doc('users/alice').update({ followerCount: 3 }));
  });

  it('the owner cannot write an arbitrary own counter', async () => {
    await assertFails(alice().doc('users/alice').update({ followerCount: 1000 }));
    await assertFails(alice().doc('users/alice').update({ username: 'a2', postCount: 50 }));
  });

  it('the owner still edits the profile and bumps own counters by 1', async () => {
    await assertSucceeds(alice().doc('users/alice').update({ username: 'a2' }));
    await assertSucceeds(alice().doc('users/alice').update({ postCount: 2, followingCount: 3 }));
  });

  it('non-integer counters are rejected', async () => {
    await assertFails(bob().doc('users/alice').update({ followerCount: 5.5 }));
  });

  it('a new profile starts with zero counters', async () => {
    const carol = env.authenticatedContext('carol').firestore();
    await assertFails(carol.doc('users/carol').set({ username: 'carol', followerCount: 100 }));
    await assertSucceeds(carol.doc('users/carol').set({ username: 'carol', followerCount: 0, followingCount: 0, postCount: 0 }));
  });

  it('likeCount on posts and reels moves by one', async () => {
    await assertSucceeds(bob().doc('posts/p1').update({ likeCount: 4 }));
    await assertFails(bob().doc('posts/p1').update({ likeCount: 99 }));
    await assertSucceeds(bob().doc('reels/r1').update({ likeCount: 2 }));
    await assertFails(bob().doc('reels/r1').update({ shareCount: 10 }));
  });

  it('the author cannot inflate own post/reel counters', async () => {
    await assertFails(alice().doc('posts/p1').update({ likeCount: 500 }));
    await assertFails(alice().doc('reels/r1').update({ likeCount: 500 }));
    await assertSucceeds(alice().doc('posts/p1').update({ caption: 'edited' }));
  });

  it('a new post or reel cannot start with fake counts', async () => {
    const post = { authorId: 'bob', author: summary('bob'), caption: 'x', likeCount: 0, commentCount: 0, shareCount: 0 };
    await assertSucceeds(bob().doc('posts/p2').set(post));
    await assertFails(bob().doc('posts/p3').set({ ...post, likeCount: 900 }));
    await assertFails(bob().doc('reels/r2').set({ ...post, likeCount: 900 }));
  });
});
