/**
 * Firebase implementation bundle — same shape as the mock bundle returned by
 * `createApis()` in client.ts. Only construct these when
 * `isFirebaseConfigured()` is true (client.ts enforces this).
 */
import type {
  IAuthApi,
  IPostsApi,
  IStoriesApi,
  IReelsApi,
  IUsersApi,
  IMessagesApi,
  INotificationsApi,
} from '@/data/api/contracts';
import { FirebaseAuthApi } from './auth.firebase';
import { FirebasePostsApi } from './posts.firebase';
import { FirebaseStoriesApi } from './stories.firebase';
import { FirebaseReelsApi } from './reels.firebase';
import { FirebaseUsersApi } from './users.firebase';
import { FirebaseMessagesApi } from './messages.firebase';
import { FirebaseNotificationsApi } from './notifications.firebase';

export interface FirebaseApis {
  authApi: IAuthApi;
  postsApi: IPostsApi;
  storiesApi: IStoriesApi;
  reelsApi: IReelsApi;
  usersApi: IUsersApi;
  messagesApi: IMessagesApi;
  notificationsApi: INotificationsApi;
}

export function createFirebaseApis(): FirebaseApis {
  return {
    authApi: new FirebaseAuthApi(),
    postsApi: new FirebasePostsApi(),
    storiesApi: new FirebaseStoriesApi(),
    reelsApi: new FirebaseReelsApi(),
    usersApi: new FirebaseUsersApi(),
    messagesApi: new FirebaseMessagesApi(),
    notificationsApi: new FirebaseNotificationsApi(),
  };
}

export { uploadMedia } from './upload';
