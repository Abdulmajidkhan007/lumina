import { afterAll as after, beforeAll as before, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { seed, setup, summary } from '../helpers/env.js';

// Security audit 2026-11-10, findings L-2 / L-4 / L-5 (PR A).
describe('audit A', () => {
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
      'staffRoles/admin': { role: 'admin' },
      'users/alice': { username: 'alice', usernameLower: 'alice', displayName: 'Alice', isVerified: false, followerCount: 0, followingCount: 0, postCount: 0 },
      'users/bob': { username: 'bob', usernameLower: 'bob', displayName: 'Bob', isVerified: false, followerCount: 0, followingCount: 0, postCount: 0 },
      'conversations/alice_bob': {
        participantIds: ['alice', 'bob'],
        participants: [summary('alice'), summary('bob')],
        unreadCounts: {},
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    });
  });

  const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true }).firestore();

  // ---------------- L-2: users ----------------
  describe('L-2 users', () => {
    const profile = {
      username: 'carol',
      usernameLower: 'carol',
      displayName: 'Carol',
      avatarUrl: null,
      bio: null,
      website: null,
      isVerified: false,
      isPrivate: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: '2026-11-01T00:00:00.000Z',
    };

    it('create: normal profile ok, isVerified:true / unknown field / long username rejected', async () => {
      await assertSucceeds(as('carol').doc('users/carol').set(profile));
      await assertFails(as('dave').doc('users/dave').set({ ...profile, isVerified: true }));
      await assertFails(as('dave').doc('users/dave').set({ ...profile, role: 'admin' }));
      await assertFails(as('dave').doc('users/dave').set({ ...profile, username: 'x'.repeat(31) }));
      await assertFails(as('dave').doc('users/dave').set({ ...profile, bio: 'x'.repeat(151) }));
    });

    it('owner cannot flip isVerified, admin can', async () => {
      await assertFails(as('alice').doc('users/alice').update({ isVerified: true }));
      await assertFails(as('alice').doc('users/alice').update({ isVerified: true, bio: 'hi' }));
      await assertSucceeds(as('admin').doc('users/alice').update({ isVerified: true }));
    });

    it('other users cannot edit a profile; admin cannot edit other fields', async () => {
      await assertFails(as('bob').doc('users/alice').update({ bio: 'pwned' }));
      await assertFails(as('admin').doc('users/alice').update({ bio: 'pwned' }));
    });

    it('owner can still edit real profile fields', async () => {
      await assertSucceeds(
        as('alice').doc('users/alice').update({
          displayName: 'Alice A',
          username: 'alice2',
          usernameLower: 'alice2',
          bio: 'hello',
          website: 'https://x.dev',
          birthday: '2000-01-01',
          isPrivate: true,
          avatarUrl: 'https://img/a.png',
        }),
      );
      await assertSucceeds(as('alice').doc('users/alice').update({ isProfessional: true }));
      await assertSucceeds(as('alice').doc('users/alice').update({ deactivated: true }));
      await assertSucceeds(as('alice').doc('users/alice').update({ lastActiveAt: '2026-11-02T00:00:00.000Z' }));
      await assertFails(as('alice').doc('users/alice').update({ role: 'admin' }));
      await assertFails(as('alice').doc('users/alice').update({ bio: 'x'.repeat(151) }));
    });
  });

  // ---------------- L-4: messaging ----------------
  describe('L-4 messaging', () => {
    const msg = (senderId, text = 'hi') => ({
      senderId,
      sender: summary(senderId),
      text,
      createdAt: '2026-11-02T00:00:00.000Z',
      status: 'sent',
    });

    it('message create: only as yourself, bounded, known fields', async () => {
      const m = 'conversations/alice_bob/messages';
      await assertSucceeds(as('alice').doc(`${m}/m1`).set(msg('alice')));
      await assertFails(as('alice').doc(`${m}/m2`).set(msg('bob')));
      await assertFails(as('alice').doc(`${m}/m3`).set({ ...msg('alice'), text: 'x'.repeat(4001) }));
      await assertFails(as('alice').doc(`${m}/m4`).set({ ...msg('alice'), extra: 1 }));
      await assertFails(as('alice').doc(`${m}/m5`).set({ ...msg('alice'), sender: summary('bob') }));
      await assertFails(as('carol').doc(`${m}/m6`).set(msg('carol')));
    });

    it('conversation update: participantIds immutable, only known fields', async () => {
      const c = 'conversations/alice_bob';
      await assertSucceeds(
        as('alice').doc(c).update({
          lastMessage: { text: 'hi', senderId: 'alice', createdAt: 'x', status: 'sent' },
          updatedAt: '2026-11-02T00:00:00.000Z',
          'unreadCounts.bob': 1,
        }),
      );
      await assertFails(as('alice').doc(c).update({ participantIds: ['alice', 'bob', 'carol'] }));
      await assertFails(as('alice').doc(c).update({ participantIds: ['alice'] }));
      await assertFails(as('alice').doc(c).update({ foo: 1 }));
      await assertFails(as('carol').doc(c).update({ updatedAt: 'x' }));
    });

    it('conversation create: exactly two participants incl. self, deterministic id', async () => {
      const doc = (ids) => ({ participantIds: ids, participants: [], unreadCounts: {}, updatedAt: 'x' });
      await assertSucceeds(as('alice').doc('conversations/alice_carol').set(doc(['alice', 'carol'])));
      await assertFails(as('alice').doc('conversations/alice_x').set(doc(['alice', 'carol', 'dave'])));
      await assertFails(as('alice').doc('conversations/alice_y').set(doc(['alice'])));
      await assertFails(as('alice').doc('conversations/bad-id').set(doc(['alice', 'carol'])));
      await assertFails(as('alice').doc('conversations/carol_dave').set(doc(['carol', 'dave'])));
    });
  });

  // ---------------- L-5: notifications / posts / comments ----------------
  describe('L-5 content shape', () => {
    const notif = (actorId, extra = {}) => ({
      type: 'collab_invite',
      actor: summary(actorId),
      postPreview: { postId: 'p1', thumbnailUri: 'https://img/t.png' },
      createdAt: '2026-11-02T00:00:00.000Z',
      read: false,
      ...extra,
    });

    it('notification create: actor must be the caller, known type/fields, bounded', async () => {
      const n = 'users/bob/notifications';
      await assertSucceeds(as('alice').doc(`${n}/n1`).set(notif('alice')));
      await assertFails(as('alice').doc(`${n}/n2`).set(notif('carol')));
      await assertFails(as('alice').doc(`${n}/n3`).set(notif('alice', { type: 'phishing' })));
      await assertFails(as('alice').doc(`${n}/n4`).set(notif('alice', { evil: 'x' })));
      await assertFails(as('alice').doc(`${n}/n5`).set(notif('alice', { type: 'comment', commentText: 'x'.repeat(2001) })));
      await assertFails(as('alice').doc(`${n}/n6`).set(notif('alice', { read: true })));
    });

    const post = (authorId, extra = {}) => ({
      authorId,
      author: summary(authorId),
      media: [{ type: 'image', uri: 'https://img/a.png', width: 1, height: 1 }],
      caption: 'hello',
      hashtags: [],
      likeCount: 0,
      commentCount: 0,
      createdAt: '2026-11-02T00:00:00.000Z',
      ...extra,
    });

    it('post create: author snapshot, size and fields checked', async () => {
      await assertSucceeds(as('alice').doc('posts/p1').set(post('alice')));
      await assertFails(as('alice').doc('posts/p2').set(post('alice', { author: summary('bob') })));
      await assertFails(as('alice').doc('posts/p3').set(post('alice', { caption: 'x'.repeat(2201) })));
      await assertFails(as('alice').doc('posts/p4').set(post('alice', { evil: true })));
      await assertFails(as('alice').doc('posts/p5').set(post('alice', { media: [] })));
    });

    const comment = (authorId, extra = {}) => ({
      postId: 'p1',
      authorId,
      author: summary(authorId),
      text: 'nice',
      likeCount: 0,
      createdAt: '2026-11-02T00:00:00.000Z',
      replyCount: 0,
      parentId: null,
      ...extra,
    });

    it('comment create: author snapshot, text length, fields checked', async () => {
      await seed(env, { 'posts/p1': post('bob') });
      const c = 'posts/p1/comments';
      await assertSucceeds(as('alice').doc(`${c}/c1`).set(comment('alice')));
      await assertFails(as('alice').doc(`${c}/c2`).set(comment('alice', { author: summary('bob') })));
      await assertFails(as('alice').doc(`${c}/c3`).set(comment('alice', { text: 'x'.repeat(2201) })));
      await assertFails(as('alice').doc(`${c}/c4`).set(comment('alice', { text: '' })));
      await assertFails(as('alice').doc(`${c}/c5`).set(comment('alice', { evil: 1 })));
    });
  });
});
