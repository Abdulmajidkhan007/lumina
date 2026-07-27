/**
 * "Download your information" — assembles the signed-in user's own data into
 * a single JSON document and hands it to the OS share sheet so they can save
 * or send it (App Store / Play data-portability expectation).
 *
 * Reads only data the user owns or already sees: their profile, their posts,
 * their saved-post ids, the accounts they follow / are followed by, and their
 * close-friends list. Every section is best-effort — a section that fails
 * (rules, offline) is reported as an error string rather than aborting the
 * whole export.
 */
import { Share } from 'react-native';
import { authApi, postsApi, usersApi } from '@/data/api/client';

export interface ExportedData {
  exportedAt: string;
  profile: unknown;
  posts: unknown;
  savedPosts: unknown;
  followers: unknown;
  following: unknown;
  closeFriends: unknown;
  blocked: unknown;
}

/** Runs `load` and returns its value, or an `{ error }` marker on failure. */
async function section<T>(load: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await load();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'unavailable' };
  }
}

/** Builds the export payload for the signed-in user. */
export async function buildExport(): Promise<ExportedData> {
  const me = await authApi.me();

  const [posts, savedPosts, followers, following, closeFriends, blocked] = await Promise.all([
    section(() => postsApi.getUserPosts(me.id, { limit: 100 })),
    section(() => postsApi.getSavedPosts({ limit: 100 })),
    section(() => usersApi.getFollowers(me.id)),
    section(() => usersApi.getFollowing(me.id)),
    section(() => usersApi.getCloseFriends()),
    section(() => usersApi.getBlockedUsers()),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: me,
    posts,
    savedPosts,
    followers,
    following,
    closeFriends,
    blocked,
  };
}

/**
 * Builds the export and opens the share sheet with it as pretty-printed JSON.
 * Resolves once the sheet is dismissed; throws if the data couldn't be built.
 */
export async function exportMyData(): Promise<void> {
  const data = await buildExport();
  const json = JSON.stringify(data, null, 2);
  await Share.share({
    title: 'Lumina — your data',
    message: json,
  });
}
