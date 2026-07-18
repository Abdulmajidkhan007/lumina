/**
 * Guarded Firebase availability check + typed instance accessors.
 *
 * Native Firebase auto-initializes its default app from the platform config
 * files (`android/app/google-services.json`, `ios/.../GoogleService-Info.plist`)
 * at build time. If those files are absent, no default app is ever created —
 * `getApps()` stays empty and every RNFirebase call would otherwise throw.
 *
 * `isFirebaseConfigured()` is the single source of truth the rest of the app
 * uses to decide whether it's safe to reach for the Firebase implementations
 * (see `src/data/api/client.ts`). Nothing in this file throws on its own;
 * callers are expected to check `isFirebaseConfigured()` first.
 *
 * NOTE: These accessors deliberately use the NAMESPACED (chainable) RNFirebase
 * API — `firestore()`, `auth()`, `storage()` — bound to the default app,
 * rather than the modular `getFirestore(app)`/`getAuth(app)`/`getStorage(app)`
 * functions. The modular API has been observed to throw
 * "Cannot read property 'call' of undefined" in RELEASE Hermes builds (new
 * architecture, Proguard off) when its internal interop shims get
 * minified/reordered by the release bundler — the namespaced default-app
 * calls do not go through that shim and are release-stable. See
 * `src/data/api/firebase/**` for the corresponding namespaced query usage.
 */
import { getApp, getApps } from '@react-native-firebase/app';
import type { ReactNativeFirebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import type { FirebaseStorageTypes } from '@react-native-firebase/storage';

/**
 * True only when a native Firebase config file was present at build time
 * and the default app was auto-initialized from it.
 */
export function isFirebaseConfigured(): boolean {
  return getApps().length > 0;
}

/** The default Firebase app instance. Only call once `isFirebaseConfigured()` is true. */
export function getFirebaseApp(): ReactNativeFirebase.FirebaseApp {
  return getApp();
}

/** Typed Auth instance bound to the default app (namespaced API). */
export function getFirebaseAuth(): FirebaseAuthTypes.Module {
  return auth();
}

/** Typed Firestore instance bound to the default app (namespaced API). */
export function getFirebaseFirestore(): FirebaseFirestoreTypes.Module {
  return firestore();
}

/** Typed Storage instance bound to the default app (namespaced API). */
export function getFirebaseStorage(): FirebaseStorageTypes.Module {
  return storage();
}
