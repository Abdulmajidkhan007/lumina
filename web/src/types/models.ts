/**
 * Domain types for the web app + admin panel.
 *
 * Field names and shapes are kept in lockstep with the mobile app's
 * Firestore schema (see `src/data/api/firebase/*.firebase.ts` and
 * `src/schemas/*.schema.ts` in the root project) so posts/users authored on
 * one platform render correctly on the other.
 */

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface UserProfile extends UserSummary {
  usernameLower: string;
  bio: string | null;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

interface MediaBase {
  uri: string;
  width: number;
  height: number;
}

export interface ImageMedia extends MediaBase {
  type: 'image';
}

export interface VideoMedia extends MediaBase {
  type: 'video';
  thumbnailUri?: string;
  durationMs?: number;
}

export type MediaItem = ImageMedia | VideoMedia;

export interface Post {
  id: string;
  authorId: string;
  author: UserSummary;
  media: MediaItem[];
  caption: string | null;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

export const ACTIVITY_TYPES = [
  'signup',
  'login',
  'google_login',
  'logout',
  'password_reset',
  'password_change',
  'account_delete',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityLog {
  id: string;
  type: ActivityType;
  uid: string | null;
  email: string | null;
  platform: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}
