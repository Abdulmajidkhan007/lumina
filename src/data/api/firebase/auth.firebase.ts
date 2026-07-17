/**
 * Firebase-backed IAuthApi.
 *
 * Firestore schema:
 *  - `users/{uid}` — profile doc created on signup, read on login/getSession/me.
 *    Fields: username, usernameLower, displayName, avatarUrl, bio, isVerified,
 *    isPrivate, followerCount, followingCount, postCount, createdAt (ISO string).
 *    `isFollowedByMe` / `isMe` are viewer-relative and computed here, never stored.
 */
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import type { IAuthApi, AuthSession } from '@/data/api/contracts';
import type { User } from '@/types/models';
import type { LoginInput, SignupInput, EditProfileInput } from '@/types/forms';
import { userSchema } from '@/schemas';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import { Config } from '@/constants/config';
import { logActivity } from '@/data/services/activityLog';
import type { UserDocFields } from './helpers';
import { uploadMedia } from './upload';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GoogleSignin.configure() only needs to run once per process — guarded so
// repeated `loginWithGoogle()` calls (or hot reload in dev) don't re-issue it.
let googleSignInConfigured = false;
function ensureGoogleSignInConfigured(): void {
  if (googleSignInConfigured) return;
  GoogleSignin.configure({ webClientId: Config.GOOGLE_WEB_CLIENT_ID });
  googleSignInConfigured = true;
}

function usersCollectionDoc(uid: string) {
  return doc(getFirebaseFirestore(), 'users', uid);
}

function fallbackUsernameFrom(email: string | null, uid: string): string {
  if (email) {
    const [local] = email.split('@');
    if (local && local.length > 0) return local;
  }
  return `user_${uid.slice(0, 8)}`;
}

export class FirebaseAuthApi implements IAuthApi {
  /** Reads `users/{uid}`, creating a minimal fallback profile if it's missing. */
  private async fetchOrCreateProfile(fbUser: FirebaseAuthTypes.User): Promise<User> {
    const profileRef = usersCollectionDoc(fbUser.uid);
    let snap = await getDoc(profileRef);

    if (!snap.exists()) {
      const now = new Date().toISOString();
      const fallbackUsername = fallbackUsernameFrom(fbUser.email, fbUser.uid);
      const profile: UserDocFields = {
        username: fallbackUsername,
        usernameLower: fallbackUsername.toLowerCase(),
        displayName: fbUser.displayName ?? fallbackUsername,
        avatarUrl: fbUser.photoURL ?? null,
        bio: null,
        isVerified: false,
        isPrivate: false,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: now,
      };
      await setDoc(profileRef, profile);
      snap = await getDoc(profileRef);
    }

    const data = snap.data() as Partial<UserDocFields> | undefined;
    const candidate = {
      id: fbUser.uid,
      username: data?.username,
      displayName: data?.displayName,
      avatarUrl: data?.avatarUrl ?? null,
      bio: data?.bio ?? null,
      isVerified: data?.isVerified ?? false,
      isPrivate: data?.isPrivate ?? false,
      followerCount: data?.followerCount ?? 0,
      followingCount: data?.followingCount ?? 0,
      postCount: data?.postCount ?? 0,
      isFollowedByMe: false,
      isMe: true,
      createdAt: data?.createdAt,
    };

    // This is the authenticated user's own profile — surface schema drift
    // loudly rather than silently dropping the session (unlike list reads,
    // there is no "just skip this item" option for a single required record).
    return userSchema.parse(candidate);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    if (!EMAIL_LIKE.test(input.identifier)) {
      throw new Error(
        'Firebase auth currently supports email/password sign-in only (phone identifiers are not yet wired up).',
      );
    }
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, input.identifier, input.password);
    const [user, token] = await Promise.all([
      this.fetchOrCreateProfile(credential.user),
      credential.user.getIdToken(),
    ]);
    void logActivity('login');
    return { token, user };
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const now = new Date().toISOString();
    const profile: UserDocFields = {
      username: input.username,
      usernameLower: input.username.toLowerCase(),
      displayName: input.displayName,
      avatarUrl: null,
      bio: null,
      isVerified: false,
      isPrivate: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: now,
    };
    await setDoc(usersCollectionDoc(credential.user.uid), profile);

    // Fire-and-forget — verification email delivery must never block signup.
    try {
      await sendEmailVerification(credential.user);
    } catch (error) {
      console.warn('[auth] failed to send verification email:', error);
    }

    const user = userSchema.parse({
      id: credential.user.uid,
      ...profile,
      isFollowedByMe: false,
      isMe: true,
    });
    const token = await credential.user.getIdToken();
    void logActivity('signup');
    return { token, user };
  }

  /**
   * Signs in via Google (Firebase credential exchange). Throws
   * `Error('cancelled')` when the user dismisses the native account picker,
   * so callers (see `useGoogleLogin`) can skip showing an error banner for
   * an intentional no-op.
   */
  async loginWithGoogle(): Promise<AuthSession> {
    ensureGoogleSignInConfigured();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw new Error('cancelled');
    }
    if (!isSuccessResponse(response)) {
      throw new Error('Google sign-in did not return a signed-in user.');
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(getFirebaseAuth(), googleCredential);
    const [user, token] = await Promise.all([
      this.fetchOrCreateProfile(credential.user),
      credential.user.getIdToken(),
    ]);
    void logActivity('google_login');
    return { token, user };
  }

  async logout(): Promise<void> {
    void logActivity('logout');
    await signOut(getFirebaseAuth());
  }

  async getSession(): Promise<AuthSession | null> {
    const current = getFirebaseAuth().currentUser;
    if (!current) return null;
    const [user, token] = await Promise.all([
      this.fetchOrCreateProfile(current),
      current.getIdToken(),
    ]);
    return { token, user };
  }

  async me(): Promise<User> {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      throw new Error('Not authenticated');
    }
    return this.fetchOrCreateProfile(current);
  }

  async updateProfile(input: EditProfileInput, avatarLocalUri?: string): Promise<User> {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      throw new Error('Not authenticated');
    }
    const bio = input.bio && input.bio.length > 0 ? input.bio : null;
    const isLocalUri = !!avatarLocalUri && !avatarLocalUri.startsWith('http');
    const avatarUrl = isLocalUri
      ? await uploadMedia(avatarLocalUri as string, `avatars/${current.uid}/${Date.now()}`)
      : undefined;

    await updateDoc(usersCollectionDoc(current.uid), {
      displayName: input.displayName,
      username: input.username,
      usernameLower: input.username.toLowerCase(),
      bio,
      isPrivate: input.isPrivate,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });
    return this.fetchOrCreateProfile(current);
  }

  /** Delegates to Firebase Auth — errors (e.g. `auth/invalid-email`) propagate as-is. */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
    void logActivity('password_reset', { email });
  }

  async getCurrentUserEmail(): Promise<string | null> {
    return getFirebaseAuth().currentUser?.email ?? null;
  }

  /**
   * Google-authenticated users are treated as verified since Google already
   * verified the address on its end; there's no separate Firebase-side flag
   * for that, so we key off the presence of a `google.com` provider entry.
   */
  isEmailVerified(): boolean {
    const current = getFirebaseAuth().currentUser;
    if (!current) return false;
    const isGoogleUser = current.providerData.some((p) => p.providerId === 'google.com');
    return isGoogleUser || current.emailVerified;
  }

  async resendVerificationEmail(): Promise<void> {
    const current = getFirebaseAuth().currentUser;
    if (!current || current.emailVerified) return;
    await sendEmailVerification(current);
  }

  /**
   * Re-authenticates with `currentPassword` before applying `newPassword` —
   * Firebase requires a "recent" sign-in for `updatePassword`, and this also
   * closes the security gap of allowing a password change from a merely
   * still-signed-in session without proving the current credential.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const current = getFirebaseAuth().currentUser;
    if (!current || !current.email) {
      throw new Error('Not authenticated');
    }

    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    try {
      await reauthenticateWithCredential(current, credential);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Current password is incorrect.');
      }
      throw error;
    }

    await updatePassword(current, newPassword);
    void logActivity('password_change');
  }

  /**
   * Permanently deletes the signed-in user: the `users/{uid}` Firestore doc
   * first, then the Firebase Auth credential itself. Firebase requires a
   * "recent" sign-in for this — if the session is stale it throws
   * `auth/requires-recent-login`, which we rethrow with actionable copy
   * since the client has no password on hand to silently reauthenticate.
   */
  async deleteAccount(): Promise<void> {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      throw new Error('Not authenticated');
    }

    await deleteDoc(usersCollectionDoc(current.uid));
    void logActivity('account_delete');

    try {
      await deleteUser(current);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'auth/requires-recent-login') {
        throw new Error('Please log out, log back in, and try again.');
      }
      throw error;
    }
  }
}
