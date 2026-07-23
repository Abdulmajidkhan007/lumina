/**
 * Cloud Storage helpers (web) — uploads user media to the same buckets/paths
 * the mobile app uses (see `src/data/api/firebase/upload.ts` + `storage.rules`
 * in the root project): posts/{uid}/…, avatars/{uid}/….
 */
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, auth } from './firebase';

const storage = getStorage(app);

/**
 * Uploads a File/Blob to `path/{timestamp}_{index}` under the signed-in user's
 * folder and returns its public download URL. Throws when signed out.
 */
export async function uploadMedia(file: Blob, folder: 'posts' | 'avatars'): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to upload media.');
  const objectRef = ref(storage, `${folder}/${uid}/${Date.now()}_${Math.round(performance.now())}`);
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}
