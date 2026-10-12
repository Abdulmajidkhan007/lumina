import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { actors, createEnv, seed, todayUtc, UID } from './helpers';

let env: RulesTestEnvironment;
let db: ReturnType<typeof actors>;

beforeAll(async () => {
  env = await createEnv();
  db = actors(env);
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

afterAll(async () => {
  await env.cleanup();
});

describe('blocked users', () => {
  it('cannot create posts, comments or likes, or edit their profile', async () => {
    await assertFails(
      setDoc(doc(db.banned, 'posts', 'p-banned'), { authorId: UID.banned, caption: 'x', createdAt: 'now' }),
    );
    await assertFails(
      addDoc(collection(db.banned, 'posts', 'post-alice', 'comments'), { authorId: UID.banned, text: 'x' }),
    );
    await assertFails(setDoc(doc(db.banned, 'posts', 'post-alice', 'likes', UID.banned), { at: 1 }));
    await assertFails(updateDoc(doc(db.banned, 'users', UID.banned), { bio: 'still here' }));
    await assertFails(
      setDoc(doc(db.banned, 'users', UID.alice, 'notifications', 'n1'), { type: 'follow' }),
    );
  });

  it('can still read, and see their own ban', async () => {
    await assertSucceeds(getDoc(doc(db.banned, 'posts', 'post-alice')));
    await assertSucceeds(getDoc(doc(db.banned, 'userBans', UID.banned)));
  });

  it('does not affect other users', async () => {
    await assertSucceeds(
      setDoc(doc(db.alice, 'posts', 'p-alice-2'), { authorId: UID.alice, caption: 'ok', createdAt: 'now' }),
    );
    await assertSucceeds(updateDoc(doc(db.alice, 'users', UID.alice), { bio: 'hi' }));
  });
});

describe('staff roles', () => {
  const role = (r: string, by: string) => ({ role: r, updatedBy: by, updatedAt: serverTimestamp() });

  it('an ordinary user cannot grant a role, to anyone', async () => {
    await assertFails(setDoc(doc(db.alice, 'staffRoles', UID.alice), role('admin', UID.alice)));
    await assertFails(setDoc(doc(db.alice, 'staffRoles', UID.bob), role('moderator', UID.alice)));
  });

  it('a moderator cannot grant roles', async () => {
    await assertFails(setDoc(doc(db.moderator, 'staffRoles', UID.bob), role('moderator', UID.moderator)));
  });

  it('the owner and admins can grant and revoke roles', async () => {
    await assertSucceeds(setDoc(doc(db.owner, 'staffRoles', UID.bob), role('moderator', UID.owner)));
    await assertSucceeds(setDoc(doc(db.admin, 'staffRoles', UID.alice), role('admin', UID.admin)));
    await assertSucceeds(deleteDoc(doc(db.admin, 'staffRoles', UID.moderator)));
  });

  it('an admin cannot change or remove their own role', async () => {
    await assertFails(setDoc(doc(db.admin, 'staffRoles', UID.admin), role('moderator', UID.admin)));
    await assertFails(deleteDoc(doc(db.admin, 'staffRoles', UID.admin)));
  });

  it('rejects unknown roles and spoofed authors', async () => {
    await assertFails(setDoc(doc(db.owner, 'staffRoles', UID.bob), role('superuser', UID.owner)));
    await assertFails(setDoc(doc(db.owner, 'staffRoles', UID.bob), role('moderator', UID.admin)));
  });

  it('an unverified email is not the owner', async () => {
    await assertFails(setDoc(doc(db.fakeOwner, 'staffRoles', UID.bob), role('admin', 'fake-uid')));
    await assertFails(getDocs(collection(db.fakeOwner, 'reports')));
  });

  it('users read only their own role; staff list all', async () => {
    await assertSucceeds(getDoc(doc(db.moderator, 'staffRoles', UID.moderator)));
    await assertSucceeds(getDoc(doc(db.alice, 'staffRoles', UID.alice)));
    await assertFails(getDoc(doc(db.alice, 'staffRoles', UID.admin)));
    await assertSucceeds(getDocs(collection(db.moderator, 'staffRoles')));
    await assertFails(getDocs(collection(db.alice, 'staffRoles')));
  });
});

describe('blocking', () => {
  const ban = (by: string) => ({ reason: 'spam', bannedBy: by, createdAt: serverTimestamp() });

  it('staff can block and unblock an ordinary user', async () => {
    await assertSucceeds(setDoc(doc(db.moderator, 'userBans', UID.alice), ban(UID.moderator)));
    await assertSucceeds(deleteDoc(doc(db.moderator, 'userBans', UID.banned)));
  });

  it('an ordinary user cannot block anyone', async () => {
    await assertFails(setDoc(doc(db.alice, 'userBans', UID.bob), ban(UID.alice)));
    await assertFails(deleteDoc(doc(db.banned, 'userBans', UID.banned)));
  });

  it('a moderator cannot block staff; nobody blocks themselves', async () => {
    await assertFails(setDoc(doc(db.moderator, 'userBans', UID.admin), ban(UID.moderator)));
    await assertFails(setDoc(doc(db.admin, 'userBans', UID.admin), ban(UID.admin)));
    await assertSucceeds(setDoc(doc(db.admin, 'userBans', UID.moderator), ban(UID.admin)));
  });

  it('others cannot read a ban', async () => {
    await assertFails(getDoc(doc(db.alice, 'userBans', UID.banned)));
  });
});

describe('reports workflow', () => {
  const move = (status: string, uid: string) => ({ status, updatedBy: uid, updatedAt: serverTimestamp() });

  it('a report is filed as open only', async () => {
    const base = { reporterId: UID.alice, targetType: 'post', targetId: 'x', reason: 'r', createdAt: 'now' };
    await assertSucceeds(addDoc(collection(db.alice, 'reports'), { ...base, status: 'open' }));
    await assertSucceeds(addDoc(collection(db.alice, 'reports'), base));
    await assertFails(addDoc(collection(db.alice, 'reports'), { ...base, status: 'resolved' }));
  });

  it('only staff read reports', async () => {
    await assertFails(getDocs(collection(db.alice, 'reports')));
    await assertSucceeds(getDocs(collection(db.moderator, 'reports')));
  });

  it('staff move a report open -> reviewing -> resolved', async () => {
    const ref = doc(db.moderator, 'reports', 'r-open');
    await assertSucceeds(updateDoc(ref, move('reviewing', UID.moderator)));
    await assertSucceeds(updateDoc(ref, move('resolved', UID.moderator)));
  });

  it('a legacy report without status counts as open', async () => {
    await assertSucceeds(updateDoc(doc(db.owner, 'reports', 'r-legacy'), move('dismissed', UID.owner)));
  });

  it('a closed report can only be reopened to reviewing', async () => {
    const ref = doc(db.moderator, 'reports', 'r-resolved');
    await assertFails(updateDoc(ref, move('dismissed', UID.moderator)));
    await assertSucceeds(updateDoc(ref, move('reviewing', UID.moderator)));
  });

  it('the filing itself cannot be edited, and users cannot move status', async () => {
    await assertFails(updateDoc(doc(db.moderator, 'reports', 'r-open'), { reason: 'edited' }));
    await assertFails(updateDoc(doc(db.bob, 'reports', 'r-open'), move('dismissed', UID.bob)));
  });

  it('staff append audit entries under their own id', async () => {
    const trail = collection(db.moderator, 'reports', 'r-open', 'resolutions');
    await assertSucceeds(
      addDoc(trail, { action: 'note', note: 'looking', moderatorId: UID.moderator, createdAt: serverTimestamp() }),
    );
    await assertFails(
      addDoc(trail, { action: 'note', note: 'spoof', moderatorId: UID.owner, createdAt: serverTimestamp() }),
    );
    await assertFails(
      addDoc(collection(db.alice, 'reports', 'r-open', 'resolutions'), {
        action: 'note',
        moderatorId: UID.alice,
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('hiding posts', () => {
  const hide = (uid: string) => ({ hidden: true, hiddenBy: uid, hiddenAt: serverTimestamp(), hiddenReason: 'r' });

  it('staff can hide a post but not edit its content', async () => {
    await assertSucceeds(updateDoc(doc(db.moderator, 'posts', 'post-alice'), hide(UID.moderator)));
    await assertFails(updateDoc(doc(db.moderator, 'posts', 'post-alice'), { caption: 'edited by mod' }));
  });

  it('an author cannot pre-hide on create or unhide later', async () => {
    await assertFails(
      setDoc(doc(db.alice, 'posts', 'p-new'), { authorId: UID.alice, hidden: false, createdAt: 'now' }),
    );
    await env.withSecurityRulesDisabled(async (c) => {
      await updateDoc(doc(c.firestore(), 'posts', 'post-alice'), { hidden: true });
    });
    await assertFails(updateDoc(doc(db.alice, 'posts', 'post-alice'), { hidden: false }));
    await assertSucceeds(updateDoc(doc(db.alice, 'posts', 'post-alice'), { caption: 'new caption' }));
  });

  it('staff can remove a reel copy; other users cannot', async () => {
    await assertFails(deleteDoc(doc(db.bob, 'reels', 'post-alice')));
    await assertSucceeds(deleteDoc(doc(db.moderator, 'reels', 'post-alice')));
  });
});

describe('broadcasts', () => {
  const message = (uid: string, extra: Record<string, unknown> = {}) => ({
    title: 'Update',
    body: 'New version is out',
    createdBy: uid,
    createdAt: serverTimestamp(),
    ...extra,
  });

  it('only admins publish', async () => {
    await assertSucceeds(addDoc(collection(db.owner, 'broadcasts'), message(UID.owner)));
    await assertSucceeds(
      addDoc(collection(db.admin, 'broadcasts'), message(UID.admin, { link: 'https://lumina-007app.web.app' })),
    );
    await assertFails(addDoc(collection(db.moderator, 'broadcasts'), message(UID.moderator)));
    await assertFails(addDoc(collection(db.alice, 'broadcasts'), message(UID.alice)));
  });

  it('validates shape: title, link scheme, server time, author', async () => {
    const col = collection(db.owner, 'broadcasts');
    await assertFails(addDoc(col, message(UID.owner, { title: '' })));
    await assertFails(addDoc(col, message(UID.owner, { link: 'javascript:alert(1)' })));
    await assertFails(addDoc(col, message(UID.owner, { createdAt: Timestamp.fromMillis(0) })));
    await assertFails(addDoc(col, message(UID.alice)));
    await assertFails(addDoc(col, message(UID.owner, { audience: 'vip' })));
  });

  it('every signed-in user reads; anonymous visitors do not; nobody edits', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'broadcasts', 'b1'), { title: 't', body: 'b', createdBy: UID.owner });
    });
    await assertSucceeds(getDocs(collection(db.alice, 'broadcasts')));
    await assertSucceeds(getDoc(doc(db.banned, 'broadcasts', 'b1')));
    await assertFails(getDocs(collection(db.anon, 'broadcasts')));
    await assertFails(updateDoc(doc(db.owner, 'broadcasts', 'b1'), { title: 'edited' }));
    await assertSucceeds(deleteDoc(doc(db.owner, 'broadcasts', 'b1')));
  });

  it('read state is private to each user', async () => {
    await assertSucceeds(setDoc(doc(db.alice, 'broadcastReads', UID.alice), { readAt: serverTimestamp() }));
    await assertSucceeds(getDoc(doc(db.alice, 'broadcastReads', UID.alice)));
    await assertFails(setDoc(doc(db.bob, 'broadcastReads', UID.alice), { readAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db.bob, 'broadcastReads', UID.alice)));
  });
});

describe('daily activity and private profiles', () => {
  it('a user marks only themselves active, only for today (UTC)', async () => {
    const today = todayUtc();
    await assertSucceeds(setDoc(doc(db.alice, 'activeDays', today, 'users', UID.alice), { at: serverTimestamp() }));
    await assertFails(setDoc(doc(db.alice, 'activeDays', today, 'users', UID.bob), { at: serverTimestamp() }));
    await assertFails(
      setDoc(doc(db.alice, 'activeDays', '2020-01-01', 'users', UID.alice), { at: serverTimestamp() }),
    );
  });

  it('only staff count daily actives', async () => {
    const col = collection(db.moderator, 'activeDays', todayUtc(), 'users');
    await assertSucceeds(getCountFromServer(col));
    await assertFails(getCountFromServer(collection(db.alice, 'activeDays', todayUtc(), 'users')));
  });

  it('the sign-in email is written by its owner and read by staff', async () => {
    const own = { email: 'alice@example.com', emailLower: 'alice@example.com', updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(db.alice, 'privateProfiles', UID.alice), own));
    await assertFails(
      setDoc(doc(db.alice, 'privateProfiles', UID.alice), { ...own, email: 'ceo@example.com', emailLower: 'ceo@example.com' }),
    );
    await assertSucceeds(getDoc(doc(db.moderator, 'privateProfiles', UID.alice)));
    await assertFails(getDoc(doc(db.bob, 'privateProfiles', UID.alice)));
  });
});

describe('admin journal and activity logs', () => {
  it('staff append entries under their own id; users cannot', async () => {
    const entry = (uid: string) => ({ action: 'ban_user', actorId: uid, targetId: UID.alice, createdAt: serverTimestamp() });
    await assertSucceeds(addDoc(collection(db.moderator, 'adminLogs'), entry(UID.moderator)));
    await assertFails(addDoc(collection(db.moderator, 'adminLogs'), entry(UID.owner)));
    await assertFails(addDoc(collection(db.alice, 'adminLogs'), entry(UID.alice)));
    await assertFails(getDocs(collection(db.alice, 'adminLogs')));
  });

  it('moderators can read activity logs; users cannot', async () => {
    await assertSucceeds(getDocs(collection(db.moderator, 'activityLogs')));
    await assertFails(getDocs(collection(db.alice, 'activityLogs')));
  });
});
