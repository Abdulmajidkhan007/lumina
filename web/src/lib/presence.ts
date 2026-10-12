/**
 * Daily presence: on the first app open of a UTC day, marks the user active
 * (`activeDays/{day}/users/{uid}` — the admin DAU chart counts these),
 * stamps `users/{uid}.lastActiveAt`, and stores the sign-in email in
 * `privateProfiles/{uid}` for admin search. At most once per day per
 * browser; every failure is swallowed — telemetry never blocks the app.
 */
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { utcDayKey } from './admin/dayBuckets';

const STORAGE_PREFIX = 'lumina.presence.';

function readMarker(uid: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + uid);
  } catch {
    return null;
  }
}

function writeMarker(uid: string, day: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + uid, day);
  } catch {
    // Storage blocked — we'll simply record again next load.
  }
}

export async function recordDailyPresence(user: FirebaseUser): Promise<void> {
  const day = utcDayKey(new Date());
  if (readMarker(user.uid) === day) return;
  const writes: Promise<void>[] = [
    setDoc(doc(db, 'activeDays', day, 'users', user.uid), { at: serverTimestamp() }),
    updateDoc(doc(db, 'users', user.uid), { lastActiveAt: new Date().toISOString() }),
  ];
  if (user.email) {
    writes.push(
      setDoc(doc(db, 'privateProfiles', user.uid), {
        email: user.email,
        emailLower: user.email.toLowerCase(),
        updatedAt: serverTimestamp(),
      }),
    );
  }
  const [active] = await Promise.allSettled(writes);
  if (active?.status === 'fulfilled') writeMarker(user.uid, day);
}
