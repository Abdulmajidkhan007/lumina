/**
 * Lumina — Navigation param types
 *
 * Central source of truth for every navigator's param list. Screens should
 * type their props via the exported helper types (`AuthScreenProps`,
 * `TabScreenProps`, `ProtectedScreenProps`) rather than importing param
 * lists directly.
 */

import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ---------------------------------------------------------------------------
// Auth stack — unauthenticated flow
// ---------------------------------------------------------------------------

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// ---------------------------------------------------------------------------
// Bottom tabs — authenticated primary navigation
// ---------------------------------------------------------------------------

export type TabsParamList = {
  Feed: undefined;
  Search: undefined;
  Create: undefined;
  Reels: undefined;
  Profile: undefined;
};

// ---------------------------------------------------------------------------
// Protected stack — authenticated flow, wraps the tab navigator plus every
// screen reachable by pushing on top of the tabs.
// ---------------------------------------------------------------------------

export type ProtectedStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  PostDetail: { id: string };
  Comments: { postId: string };
  Story: { userId: string };
  UserProfile: { id: string };
  Followers: { id: string };
  Following: { id: string };
  Notifications: undefined;
  Messages: undefined;
  MessageThread: { threadId: string };
  Settings: undefined;
  EditProfile: undefined;
  CreatePost: undefined;
};

// ---------------------------------------------------------------------------
// Global RootParamList — enables untyped useNavigation() calls to infer
// params app-wide. See https://reactnavigation.org/docs/typescript
// ---------------------------------------------------------------------------

declare global {
  // Canonical React Navigation pattern for typing the root param list:
  // https://reactnavigation.org/docs/typescript
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends ProtectedStackParamList {}
  }
}

// ---------------------------------------------------------------------------
// Per-screen prop helpers
// ---------------------------------------------------------------------------

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ProtectedScreenProps<T extends keyof ProtectedStackParamList> =
  NativeStackScreenProps<ProtectedStackParamList, T>;

export type TabScreenProps<T extends keyof TabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, T>,
  NativeStackScreenProps<ProtectedStackParamList>
>;
