/**
 * Firebase Web SDK bootstrap.
 *
 * Mirrors the mobile app's Firestore schema (see `src/data/api/firebase/*`
 * in the root project) so the web app and admin panel read/write the same
 * `users`, `posts`, and related collections.
 *
 * No analytics import on purpose — `firebase/analytics` gets blocked by
 * adblockers and only adds bundle weight for a marketing/admin site.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDlvOVg5oEdjejHm6TMVFO_ExxF8Cj1qaE',
  authDomain: 'lumina-007app.firebaseapp.com',
  projectId: 'lumina-007app',
  storageBucket: 'lumina-007app.firebasestorage.app',
  messagingSenderId: '780053612664',
  appId: '1:780053612664:web:e926748fa5daef0163058d',
  measurementId: 'G-RFF6KXH7YY',
};

// Guard against re-initializing on Vite HMR reloads.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();
