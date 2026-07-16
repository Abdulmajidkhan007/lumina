/**
 * Media upload helper — puts a device-local file into Cloud Storage and
 * returns its public download URL. Used by create-post / messaging flows
 * once they are wired to the Firebase provider.
 */
import { getDownloadURL, putFile, ref } from '@react-native-firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';

/**
 * Uploads the file at `localUri` to `remotePath` (e.g. `posts/{uid}/{ts}.jpg`)
 * and resolves with the download URL to store in Firestore documents.
 */
export async function uploadMedia(localUri: string, remotePath: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), remotePath);
  await putFile(storageRef, localUri);
  return getDownloadURL(storageRef);
}
