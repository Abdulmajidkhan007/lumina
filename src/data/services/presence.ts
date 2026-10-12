/**
 * Daily presence — on the first app start of a UTC day: marks the user
 * active (`activeDays/{day}/users/{uid}`, counted by the admin DAU chart),
 * stamps `users/{uid}.lastActiveAt` and stores the sign-in email in
 * `privateProfiles/{uid}` for admin search. Once per day per device (MMKV
 * marker); never throws — telemetry must not block the app.
 */
import firestore from '@react-native-firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase';
import { mmkvStorage } from '@/lib/mmkv';
import { utcDayKey } from '@/utils/admin';

const MARKER_PREFIX = 'presence.day.';

export async function recordDailyPresence(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  const day = utcDayKey(new Date());
  const markerKey = MARKER_PREFIX + user.uid;
  if (mmkvStorage.getString(markerKey) === day) return;

  const db = getFirebaseFirestore();
  const writes: Promise<void>[] = [
    db.collection('activeDays').doc(day).collection('users').doc(user.uid).set({
      at: firestore.FieldValue.serverTimestamp(),
    }),
    db.collection('users').doc(user.uid).update({ lastActiveAt: new Date().toISOString() }),
  ];
  if (user.email) {
    writes.push(
      db.collection('privateProfiles').doc(user.uid).set({
        email: user.email,
        emailLower: user.email.toLowerCase(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }),
    );
  }
  const [active] = await Promise.allSettled(writes);
  if (active?.status === 'fulfilled') mmkvStorage.set(markerKey, day);
}
