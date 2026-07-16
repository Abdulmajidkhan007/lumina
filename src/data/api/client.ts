/**
 * API client factory.
 *
 * To swap from mock to a real backend, change ONE line:
 *   const API_PROVIDER: ApiProvider = 'supabase';
 *
 * Each exported singleton is typed as its interface — screens never import
 * concrete implementations.
 */

import type {
  IAuthApi,
  IPostsApi,
  IStoriesApi,
  IReelsApi,
  IUsersApi,
  IMessagesApi,
  INotificationsApi,
} from './contracts';

import {
  MockAuthApi,
  MockPostsApi,
  MockStoriesApi,
  MockReelsApi,
  MockUsersApi,
  MockMessagesApi,
  MockNotificationsApi,
} from './mock';
import { createFirebaseApis } from './firebase';
import { isFirebaseConfigured } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Provider union — add 'supabase' | 'firebase' | 'custom' as you integrate
// ---------------------------------------------------------------------------

type ApiProvider = 'mock' | 'supabase' | 'firebase';

// ↓ ONE-LINE SWAP: 'mock' | 'firebase' | 'supabase'
const API_PROVIDER: ApiProvider = 'firebase';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createApis(provider: ApiProvider): {
  authApi: IAuthApi;
  postsApi: IPostsApi;
  storiesApi: IStoriesApi;
  reelsApi: IReelsApi;
  usersApi: IUsersApi;
  messagesApi: IMessagesApi;
  notificationsApi: INotificationsApi;
} {
  switch (provider) {
    case 'mock':
      return {
        authApi: new MockAuthApi(),
        postsApi: new MockPostsApi(),
        storiesApi: new MockStoriesApi(),
        reelsApi: new MockReelsApi(),
        usersApi: new MockUsersApi(),
        messagesApi: new MockMessagesApi(),
        notificationsApi: new MockNotificationsApi(),
      };

    case 'supabase':
      // TODO: import and instantiate Supabase implementations here
      throw new Error('Supabase provider not yet implemented');

    case 'firebase':
      if (!isFirebaseConfigured()) {
        // Native config files (google-services.json / GoogleService-Info.plist)
        // are missing — fall back to mock so the app never crashes.
        console.warn(
          '[api/client] API_PROVIDER is "firebase" but Firebase is not configured. ' +
            'Add google-services.json / GoogleService-Info.plist and rebuild. Falling back to mock.',
        );
        return createApis('mock');
      }
      return createFirebaseApis();
  }
}

// ---------------------------------------------------------------------------
// Bound singletons — the only import screens / hooks should use
// ---------------------------------------------------------------------------

const {
  authApi,
  postsApi,
  storiesApi,
  reelsApi,
  usersApi,
  messagesApi,
  notificationsApi,
} = createApis(API_PROVIDER);

export {
  authApi,
  postsApi,
  storiesApi,
  reelsApi,
  usersApi,
  messagesApi,
  notificationsApi,
};
