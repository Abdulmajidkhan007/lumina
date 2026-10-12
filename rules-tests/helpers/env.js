/**
 * Shared emulator test environment. Each test file calls `setup()` once and
 * `env.clearFirestore()` between cases. Seeding uses `withSecurityRulesDisabled`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const rulesPath = fileURLToPath(new URL('../../firestore.rules', import.meta.url));

export async function setup() {
  return initializeTestEnvironment({
    projectId: 'demo-lumina',
    firestore: { rules: readFileSync(rulesPath, 'utf8'), host: '127.0.0.1', port: 8080 },
  });
}

export function summary(uid) {
  return { id: uid, username: uid, displayName: uid, avatarUrl: null, isVerified: false };
}

/** Writes docs with rules disabled: seed(env, { 'stories/s1': {...} }). */
export async function seed(env, docs) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [path, data] of Object.entries(docs)) {
      await db.doc(path).set(data);
    }
  });
}
