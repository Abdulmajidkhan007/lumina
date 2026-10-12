import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';

export const OWNER_EMAIL = 'santexnika.atoyo@gmail.com';

export const UID = {
  owner: 'owner-uid',
  admin: 'admin-uid',
  moderator: 'mod-uid',
  alice: 'alice-uid',
  bob: 'bob-uid',
  banned: 'banned-uid',
} as const;

const rulesPath = fileURLToPath(new URL('../../firestore.rules', import.meta.url));

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-lumina',
    firestore: { rules: readFileSync(rulesPath, 'utf8') },
  });
}

function ctx(env: RulesTestEnvironment, uid: string, email: string, verified = true): RulesTestContext {
  return env.authenticatedContext(uid, { email, email_verified: verified });
}

/** Firestore handles for each actor used across the suites. */
export function actors(env: RulesTestEnvironment) {
  return {
    owner: ctx(env, UID.owner, OWNER_EMAIL).firestore(),
    admin: ctx(env, UID.admin, 'admin@example.com').firestore(),
    moderator: ctx(env, UID.moderator, 'mod@example.com').firestore(),
    alice: ctx(env, UID.alice, 'alice@example.com').firestore(),
    bob: ctx(env, UID.bob, 'bob@example.com').firestore(),
    banned: ctx(env, UID.banned, 'banned@example.com').firestore(),
    /** Claims the owner email without verifying it. */
    fakeOwner: ctx(env, 'fake-uid', OWNER_EMAIL, false).firestore(),
    anon: env.unauthenticatedContext().firestore(),
  } satisfies Record<string, Firestore>;
}

/** Seeds roles, a ban, users and one post/reel with rules disabled. */
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const { doc, setDoc, Timestamp } = await import('firebase/firestore');
    const now = Timestamp.now();
    await setDoc(doc(db, 'staffRoles', UID.admin), { role: 'admin', updatedBy: UID.owner, updatedAt: now });
    await setDoc(doc(db, 'staffRoles', UID.moderator), { role: 'moderator', updatedBy: UID.owner, updatedAt: now });
    await setDoc(doc(db, 'userBans', UID.banned), { reason: 'spam', bannedBy: UID.owner, createdAt: now });
    for (const uid of Object.values(UID)) {
      await setDoc(doc(db, 'users', uid), {
        username: uid,
        usernameLower: uid,
        displayName: uid,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    }
    await setDoc(doc(db, 'posts', 'post-alice'), {
      authorId: UID.alice,
      caption: 'hello',
      likeCount: 0,
      commentCount: 0,
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    await setDoc(doc(db, 'reels', 'post-alice'), { authorId: UID.alice, likeCount: 0 });
    await setDoc(doc(db, 'reports', 'r-open'), {
      reporterId: UID.bob,
      targetType: 'post',
      targetId: 'post-alice',
      reason: 'spam',
      status: 'open',
      createdAt: '2026-10-10T00:00:00.000Z',
    });
    await setDoc(doc(db, 'reports', 'r-legacy'), {
      reporterId: UID.bob,
      targetType: 'user',
      targetId: UID.alice,
      reason: 'abuse',
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    await setDoc(doc(db, 'reports', 'r-resolved'), {
      reporterId: UID.bob,
      targetType: 'post',
      targetId: 'post-alice',
      reason: 'spam',
      status: 'resolved',
      createdAt: '2026-10-02T00:00:00.000Z',
    });
    await setDoc(doc(db, 'activityLogs', 'log-1'), {
      type: 'login',
      uid: UID.alice,
      createdAt: '2026-10-10T00:00:00.000Z',
    });
  });
}

/** "YYYY-MM-DD" in UTC, as the rules compute it from request.time. */
export function todayUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
