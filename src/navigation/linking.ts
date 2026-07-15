/**
 * Lumina — Deep linking configuration
 *
 * Applies to the PROTECTED navigator tree only (`ProtectedStackParamList`).
 * Auth screens are intentionally excluded: the auth gate already redirects
 * unauthenticated users, so an incoming deep link simply resolves once the
 * user lands back on the protected stack post sign-in.
 *
 * https://reactnavigation.org/docs/typescript#annotating-linking
 */

import type { LinkingOptions } from '@react-navigation/native';

import type { ProtectedStackParamList } from './types';

export const linking: LinkingOptions<ProtectedStackParamList> = {
  prefixes: ['lumina://', 'https://lumina.app'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Feed: 'feed',
          Search: 'search',
          Reels: 'reels',
          Profile: 'me',
        },
      },
      PostDetail: 'post/:id',
      Comments: 'post/:postId/comments',
      Story: 'story/:userId',
      UserProfile: 'user/:id',
      Followers: 'user/:id/followers',
      Following: 'user/:id/following',
      Notifications: 'notifications',
      Messages: 'messages',
      MessageThread: 'messages/:threadId',
      Settings: 'settings',
      EditProfile: 'settings/edit-profile',
      CreatePost: 'create',
    },
  },
};
