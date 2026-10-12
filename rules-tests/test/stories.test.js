import { afterAll as after, beforeAll as before, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { seed, setup, summary } from '../helpers/env.js';

describe('stories/{id}/views', () => {
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
      'stories/s1': { authorId: 'alice', createdAt: '2026-10-11T00:00:00.000Z' },
    });
  });

  const view = (uid) => ({ uid, viewer: summary(uid), viewedAt: '2026-10-11T01:00:00.000Z' });

  it('a viewer records their own view', async () => {
    const db = env.authenticatedContext('bob').firestore();
    await assertSucceeds(db.doc('stories/s1/views/bob').set(view('bob')));
  });

  it('a viewer cannot record a view for someone else', async () => {
    const db = env.authenticatedContext('bob').firestore();
    await assertFails(db.doc('stories/s1/views/carol').set(view('carol')));
    await assertFails(db.doc('stories/s1/views/bob').set({ ...view('bob'), uid: 'carol' }));
  });

  it('the author viewing their own story is not counted', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(db.doc('stories/s1/views/alice').set(view('alice')));
  });

  it('rejects extra fields', async () => {
    const db = env.authenticatedContext('bob').firestore();
    await assertFails(db.doc('stories/s1/views/bob').set({ ...view('bob'), likeCount: 5 }));
  });

  it('only the author reads the viewer list', async () => {
    await seed(env, { 'stories/s1/views/bob': view('bob') });
    await assertSucceeds(env.authenticatedContext('alice').firestore().collection('stories/s1/views').get());
    await assertFails(env.authenticatedContext('bob').firestore().collection('stories/s1/views').get());
    await assertFails(env.authenticatedContext('bob').firestore().doc('stories/s1/views/bob').get());
    await assertFails(env.unauthenticatedContext().firestore().collection('stories/s1/views').get());
  });

  it('views cannot be deleted', async () => {
    await seed(env, { 'stories/s1/views/bob': view('bob') });
    await assertFails(env.authenticatedContext('bob').firestore().doc('stories/s1/views/bob').delete());
  });

  it('seen markers are private to their owner', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(bob.doc('users/bob/seenStories/s1').set({ storyId: 's1', seenAt: 'x' }));
    await assertFails(env.authenticatedContext('carol').firestore().doc('users/bob/seenStories/s1').get());
  });
});
