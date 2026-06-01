/**
 * Lumina — Tabs layout
 *
 * 5 tabs: Home, Explore, Create (intercepted → modal), Reels, Profile.
 * Uses BlurTabBar as the custom tab bar component.
 * Create tab press is intercepted to push the create-post modal.
 */

import React, { useCallback } from 'react';
import { Tabs, useRouter } from 'expo-router';
import type { EventArg } from '@react-navigation/native';

import { BlurTabBar } from '@/components/BlurTabBar';

export default function TabsLayout(): React.JSX.Element {
  const router = useRouter();

  const handleCreateTabPress = useCallback(
    (e: EventArg<'tabPress', true, undefined>) => {
      // Prevent default navigation to the create placeholder screen
      e.preventDefault();
      router.push('/(protected)/(modals)/create-post');
    },
    [router],
  );

  return (
    <Tabs
      tabBar={(props) => <BlurTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen
        name="create"
        listeners={{ tabPress: handleCreateTabPress }}
      />
      <Tabs.Screen name="reels" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
