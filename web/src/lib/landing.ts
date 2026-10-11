/**
 * Landing-page screenshots, managed by the admin from the phone.
 *
 * Each screenshot is downscaled in the browser to a JPEG data URL and stored
 * in Firestore `siteContent/screen-{slot}` — publicly readable, admin-only
 * writes (firestore.rules). Not Cloud Storage: CI cannot deploy storage.rules
 * (the service account lacks the permission), so a public `landing/` Storage
 * path would never go live; Firestore rules do deploy.
 */
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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

/** Phone screenshots are shown at most ~300 px wide; 720 px keeps them sharp on retina. */
const MAX_WIDTH = 720;
/** Firestore documents are capped at 1 MiB; stay well under it. */
const MAX_DATA_URL_CHARS = 900_000;

const screenDoc = (slot: ScreenSlot) => doc(db, 'siteContent', `screen-${slot}`);

export async function fetchLandingScreens(): Promise<LandingScreens> {
  const snaps = await Promise.all(SCREEN_SLOTS.map((slot) => getDoc(screenDoc(slot))));
  const out: LandingScreens = {};
  snaps.forEach((snap, i) => {
    const url = snap.data()?.dataUrl;
    const slot = SCREEN_SLOTS[i];
    if (slot && typeof url === 'string' && url.startsWith('data:image/')) out[slot] = url;
  });
  return out;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image format cannot be read. Use a PNG or JPEG screenshot.'));
    };
    img.src = url;
  });
}

/** Downscales to MAX_WIDTH and re-encodes as JPEG, lowering quality until it fits. */
async function toCompactDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot process images.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
  }
  throw new Error('Image is too large even after compression. Use a smaller screenshot.');
}

export async function uploadLandingScreen(slot: ScreenSlot, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const dataUrl = await toCompactDataUrl(file);
  await setDoc(screenDoc(slot), { dataUrl, updatedAt: serverTimestamp() });
  return dataUrl;
}

export async function removeLandingScreen(slot: ScreenSlot): Promise<void> {
  await deleteDoc(screenDoc(slot));
}
