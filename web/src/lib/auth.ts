/**
 * Auth actions for the web app — thin wrappers around Firebase Auth that
 * additionally keep the `users/{uid}` profile doc and `activityLogs`
 * collection in sync, mirroring what the mobile app's
 * `FirebaseAuthApi` does (see `src/data/api/firebase/auth.firebase.ts` in
 * the root project) so accounts created on either platform look the same.
 */
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from './firebase';
import { logActivity } from './activity';

interface UserProfileDocFields {
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
}

function usersDoc(uid: string) {
  return doc(db, 'users', uid);
}

function usernameFromEmail(email: string | null, uid: string): string {
  if (email) {
    const [local] = email.split('@');
    if (local && local.length > 0) return local;
  }
  return `user_${uid.slice(0, 8)}`;
}

function blankProfile(username: string, displayName: string, avatarUrl: string | null): UserProfileDocFields {
  return {
    username,
    usernameLower: username.toLowerCase(),
    displayName,
    avatarUrl,
    bio: null,
    isVerified: false,
    isPrivate: false,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: new Date().toISOString(),
  };
}

/** Creates `users/{uid}` if it doesn't exist yet — used after Google sign-in. */
async function ensureProfileDoc(user: FirebaseUser): Promise<void> {
  const ref = usersDoc(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const username = usernameFromEmail(user.email, user.uid);
  await setDoc(ref, blankProfile(username, user.displayName ?? username, user.photoURL ?? null));
}

export interface SignUpParams {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export async function signUpWithEmail(params: SignUpParams): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await setDoc(usersDoc(credential.user.uid), blankProfile(params.username, params.displayName, null));
  await logActivity('signup', credential.user);
  return credential;
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await logActivity('login', credential.user);
  return credential;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const credential = await signInWithPopup(auth, googleAuthProvider);
  await ensureProfileDoc(credential.user);
  await logActivity('google_login', credential.user);
  return credential;
}

export async function signOutUser(): Promise<void> {
  // Log while still authenticated — after signOut() there is no request.auth
  // left for the Firestore write to be attributed to.
  await logActivity('logout', auth.currentUser);
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
  await logActivity('password_reset', auth.currentUser, email);
}
