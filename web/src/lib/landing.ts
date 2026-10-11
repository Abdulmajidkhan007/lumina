/**
 * Landing-page screenshots, managed by the admin from the phone.
 *
 * Images live in Storage `landing/` and their URLs in Firestore
 * `siteContent/landing` → `screens.{slot}`. Both are publicly readable (the
 * landing page is for signed-out visitors) and writable only by the admin
 * (see firestore.rules / storage.rules).
 */
import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { app, db } from './firebase';

export const SCREEN_SLOTS = ['feed', 'stories', 'reels', 'profile', 'messages'] as const;
export type ScreenSlot = (typeof SCREEN_SLOTS)[number];

/** English labels; translated at render with t(). */
export const SCREEN_LABELS: Record<ScreenSlot, string> = {
  feed: 'Feed',
  stories: 'Stories',
  reels: 'Reels',
  profile: 'Profile',
  messages: 'Messages',
};

export type LandingScreens = Partial<Record<ScreenSlot, string>>;

/** Same cap as storage.rules for `landing/`. */
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const landingDoc = () => doc(db, 'siteContent', 'landing');

export async function fetchLandingScreens(): Promise<LandingScreens> {
  const snap = await getDoc(landingDoc());
  const screens = snap.data()?.screens as Record<string, unknown> | undefined;
  const out: LandingScreens = {};
  for (const slot of SCREEN_SLOTS) {
    const url = screens?.[slot];
    if (typeof url === 'string' && url.startsWith('https://')) out[slot] = url;
  }
  return out;
}

/** Deletes a replaced/removed screenshot file; a leftover file is harmless, so failures only warn. */
async function deleteStoredScreen(url: string | undefined): Promise<void> {
  if (!url) return;
  try {
    await deleteObject(ref(getStorage(app), url));
  } catch (error) {
    console.warn('[landing] old screenshot not deleted', error);
  }
}

export async function uploadLandingScreen(slot: ScreenSlot, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size >= MAX_SCREENSHOT_BYTES) throw new Error('Image must be under 5 MB.');
  const previous = (await fetchLandingScreens())[slot];
  const objectRef = ref(getStorage(app), `landing/${slot}_${Date.now()}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  const url = await getDownloadURL(objectRef);
  await setDoc(landingDoc(), { screens: { [slot]: url }, updatedAt: serverTimestamp() }, { merge: true });
  await deleteStoredScreen(previous);
  return url;
}

export async function removeLandingScreen(slot: ScreenSlot): Promise<void> {
  const previous = (await fetchLandingScreens())[slot];
  await setDoc(
    landingDoc(),
    { screens: { [slot]: deleteField() }, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await deleteStoredScreen(previous);
}
