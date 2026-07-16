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
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import type { IAuthApi, AuthSession } from '@/data/api/contracts';
import type { User } from '@/types/models';
import type { LoginInput, SignupInput, EditProfileInput } from '@/types/forms';
import { userSchema } from '@/schemas';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import type { UserDocFields } from './helpers';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const user = userSchema.parse({
      id: credential.user.uid,
      ...profile,
      isFollowedByMe: false,
      isMe: true,
    });
    const token = await credential.user.getIdToken();
    return { token, user };
  }

  async logout(): Promise<void> {
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

  async updateProfile(input: EditProfileInput): Promise<User> {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      throw new Error('Not authenticated');
    }
    const bio = input.bio && input.bio.length > 0 ? input.bio : null;
    await updateDoc(usersCollectionDoc(current.uid), {
      displayName: input.displayName,
      username: input.username,
      usernameLower: input.username.toLowerCase(),
      bio,
      isPrivate: input.isPrivate,
    });
    return this.fetchOrCreateProfile(current);
  }
}
