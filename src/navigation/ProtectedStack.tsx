/**
 * Lumina — Protected stack
 *
 * Wraps the tab navigator plus every screen reachable by pushing on top of
 * the tabs: post detail, comments, story viewer, user profile + follow
 * lists, notifications, messages, settings, and the create-post modal.
 * headerShown is false globally — screens render their own headers.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ProtectedStackParamList } from './types';
import { TabsNavigator } from './TabsNavigator';
import PostDetailScreen from '@/screens/post/PostDetailScreen';
import CommentsScreen from '@/screens/comments/CommentsScreen';
import StoryScreen from '@/screens/story/StoryScreen';
import StoryComposerScreen from '@/screens/story/StoryComposerScreen';
import HighlightViewerScreen from '@/screens/story/HighlightViewerScreen';
import UserProfileScreen from '@/screens/user/UserProfileScreen';
import FollowersScreen from '@/screens/user/FollowersScreen';
import FollowingScreen from '@/screens/user/FollowingScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import MessagesScreen from '@/screens/messages/MessagesScreen';
import NewConversationScreen from '@/screens/messages/NewConversationScreen';
import MessageThreadScreen from '@/screens/messages/MessageThreadScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import EditProfileScreen from '@/screens/settings/EditProfileScreen';
import CreatePostScreen from '@/screens/create/CreatePostScreen';
import ChangePasswordScreen from '@/screens/settings/ChangePasswordScreen';
import SavedPostsScreen from '@/screens/profile/SavedPostsScreen';
import ArchiveScreen from '@/screens/profile/ArchiveScreen';
import NotificationsSettingsScreen from '@/screens/settings/NotificationsSettingsScreen';
import PrivacyScreen from '@/screens/settings/PrivacyScreen';
import BlockedAccountsScreen from '@/screens/settings/BlockedAccountsScreen';
import CloseFriendsScreen from '@/screens/settings/CloseFriendsScreen';
import InsightsScreen from '@/screens/settings/InsightsScreen';
import ActivityStatusScreen from '@/screens/settings/ActivityStatusScreen';
import HelpCentreScreen from '@/screens/settings/HelpCentreScreen';
import PrivacyPolicyScreen from '@/screens/settings/PrivacyPolicyScreen';
import AboutScreen from '@/screens/settings/AboutScreen';

const Stack = createNativeStackNavigator<ProtectedStackParamList>();

export function ProtectedStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />

      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ presentation: 'modal' }}
      />

      <Stack.Screen
        name="Story"
        component={StoryScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />

      <Stack.Screen
        name="StoryComposer"
        component={StoryComposerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="HighlightViewer"
        component={HighlightViewerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Followers"
        component={FollowersScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Following"
        component={FollowingScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="MessageThread"
        component={MessageThreadScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal' }}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="BlockedAccounts"
        component={BlockedAccountsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="CloseFriends"
        component={CloseFriendsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="ActivityStatus"
        component={ActivityStatusScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="HelpCentre"
        component={HelpCentreScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
