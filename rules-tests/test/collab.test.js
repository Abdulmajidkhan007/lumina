import { after, before, beforeEach, describe, it } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { seed, setup, summary } from '../helpers/env.js';

const post = (collab) => ({
  authorId: 'alice',
  author: summary('alice'),
  caption: null,
  likeCount: 0,
  commentCount: 0,
  createdAt: '2026-10-11T00:00:00.000Z',
  ...(collab ? { collab } : {}),
});
const pending = { uid: 'bob', status: 'pending', user: summary('bob') };

describe('posts.collab', () => {
  let env;
  before(async () => {
    env = await setup();
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });

  it('author creates a post with a pending invite', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertSucceeds(db.doc('posts/p1').set(post(pending)));
    await assertSucceeds(db.doc('posts/p2').set(post()));
  });

  it('author cannot create it already accepted, or invite themselves', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(db.doc('posts/p1').set(post({ ...pending, status: 'accepted' })));
    await assertFails(db.doc('posts/p1').set(post({ uid: 'alice', status: 'pending', user: summary('alice') })));
    await assertFails(db.doc('posts/p1').set(post({ ...pending, user: summary('carol') })));
  });

  it('only the invited user accepts or declines, once', async () => {
    await seed(env, { 'posts/p1': post(pending), 'posts/p2': post(pending) });
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(bob.doc('posts/p1').update({ collab: { ...pending, status: 'accepted' } }));
    await assertSucceeds(bob.doc('posts/p2').update({ collab: { ...pending, status: 'declined' } }));
    // Already answered → no flipping back.
    await assertFails(bob.doc('posts/p1').update({ collab: { ...pending, status: 'pending' } }));
    await assertFails(bob.doc('posts/p2').update({ collab: { ...pending, status: 'accepted' } }));
  });

  it('the author cannot accept for the invitee or change the collab', async () => {
    await seed(env, { 'posts/p1': post(pending) });
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('posts/p1').update({ collab: { ...pending, status: 'accepted' } }));
    await assertFails(alice.doc('posts/p1').update({ collab: { uid: 'carol', status: 'pending', user: summary('carol') } }));
    // Other edits by the author still work.
    await assertSucceeds(alice.doc('posts/p1').update({ archivedAt: '2026-10-11T01:00:00.000Z' }));
  });

  it('a third user cannot answer, and the invitee cannot touch other fields', async () => {
    await seed(env, { 'posts/p1': post(pending) });
    const carol = env.authenticatedContext('carol').firestore();
    await assertFails(carol.doc('posts/p1').update({ collab: { ...pending, status: 'accepted' } }));
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(
      bob.doc('posts/p1').update({ collab: { ...pending, status: 'accepted' }, caption: 'mine now' }),
    );
    await assertFails(bob.doc('posts/p1').update({ collab: { ...pending, status: 'accepted', user: summary('x') } }));
  });

  it('legacy posts without collab: likes/comments counters still work', async () => {
    await seed(env, { 'posts/p1': post() });
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(bob.doc('posts/p1').update({ likeCount: 1 }));
    await assertFails(bob.doc('posts/p1').update({ collab: { ...pending, status: 'accepted' } }));
  });

  it('the invitee can record their answer on their own notification only', async () => {
    await seed(env, { 'users/bob/notifications/n1': { type: 'collab_invite', read: false } });
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(bob.doc('users/bob/notifications/n1').update({ response: 'accepted', read: true }));
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('users/bob/notifications/n2').set({ type: 'collab_invite', read: false }));
    await assertFails(alice.doc('users/bob/notifications/n1').update({ response: 'accepted' }));
  });
});
