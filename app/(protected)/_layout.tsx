/**
 * Lumina — Protected group layout
 *
 * Guards all authenticated routes. Redirects to login when unauthenticated.
 * Declares all non-tab routes with their presentation styles.
 * headerShown is false globally — screens render their own headers.
 */

import React from 'react';
import { Stack, Redirect } from 'expo-router';

import { useAuthStatus } from '@/stores/auth.store';

export default function ProtectedLayout(): React.JSX.Element {
  const status = useAuthStatus();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab group */}
      <Stack.Screen name="(tabs)" />

      {/* Modals group */}
      <Stack.Screen name="(modals)" />

      {/* Post detail — card presentation */}
      <Stack.Screen
        name="post/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Comments — modal sheet */}
      <Stack.Screen
        name="comments/[postId]"
        options={{ presentation: 'modal' }}
      />

      {/* Story viewer — full-screen transparent fade */}
      <Stack.Screen
        name="story/[userId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />

      {/* User profile — card */}
      <Stack.Screen
        name="user/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Followers list */}
      <Stack.Screen
        name="user/[id]/followers"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Following list */}
      <Stack.Screen
        name="user/[id]/following"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Notifications — card */}
      <Stack.Screen
        name="notifications"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Messages list */}
      <Stack.Screen
        name="messages/index"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Message thread */}
      <Stack.Screen
        name="messages/[threadId]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Settings */}
      <Stack.Screen
        name="settings/index"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />

      {/* Edit profile */}
      <Stack.Screen
        name="settings/edit-profile"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
