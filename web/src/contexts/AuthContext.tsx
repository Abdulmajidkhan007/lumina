import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../types/models';

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

interface AuthContextValue {
  /** Raw Firebase Auth user, or null when signed out. */
  firebaseUser: FirebaseUser | null;
  /** Live `users/{uid}` profile doc for `firebaseUser`, or null while loading/missing. */
  profile: UserProfile | null;
  /** True until the very first `onAuthStateChanged` callback fires. */
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          return;
        }
        const data = snap.data() as Partial<UserProfileDocFields>;
        if (typeof data.username !== 'string' || typeof data.createdAt !== 'string') {
          setProfile(null);
          return;
        }
        setProfile({
          id: snap.id,
          username: data.username,
          usernameLower: data.usernameLower ?? data.username.toLowerCase(),
          displayName: data.displayName ?? data.username,
          avatarUrl: data.avatarUrl ?? null,
          bio: data.bio ?? null,
          isVerified: data.isVerified ?? false,
          isPrivate: data.isPrivate ?? false,
          followerCount: data.followerCount ?? 0,
          followingCount: data.followingCount ?? 0,
          postCount: data.postCount ?? 0,
          createdAt: data.createdAt,
        });
      },
      (error) => {
        console.error('[AuthContext] profile subscription failed', error);
        setProfile(null);
      },
    );
    return unsubscribe;
  }, [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ firebaseUser, profile, initializing }),
    [firebaseUser, profile, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
