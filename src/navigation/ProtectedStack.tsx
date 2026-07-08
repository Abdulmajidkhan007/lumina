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
import UserProfileScreen from '@/screens/user/UserProfileScreen';
import FollowersScreen from '@/screens/user/FollowersScreen';
import FollowingScreen from '@/screens/user/FollowingScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import MessagesScreen from '@/screens/messages/MessagesScreen';
import MessageThreadScreen from '@/screens/messages/MessageThreadScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import EditProfileScreen from '@/screens/settings/EditProfileScreen';
import CreatePostScreen from '@/screens/create/CreatePostScreen';

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
    </Stack.Navigator>
  );
}
