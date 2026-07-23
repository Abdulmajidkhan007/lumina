/**
 * Lumina — Tabs navigator
 *
 * 5 tabs: Feed, Search, Create (intercepted → pushes the CreatePost modal
 * on the parent stack), Reels, Profile. Uses BlurTabBar as the custom tab
 * bar component.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BlurTabBar } from '@/components/BlurTabBar';
import type { ProtectedStackParamList, TabsParamList } from './types';
import FeedScreen from '@/screens/feed/FeedScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import CreatePlaceholderScreen from '@/screens/create/CreatePlaceholderScreen';
import ReelsScreen from '@/screens/reels/ReelsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabsParamList>();

export function TabsNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={(props) => <BlurTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      {/* Center tab — the Direct/DM entry (Create moved to the feed header "+"). */}
      <Tab.Screen
        name="Create"
        component={CreatePlaceholderScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation
              .getParent<NativeStackNavigationProp<ProtectedStackParamList>>()
              ?.navigate('Messages');
          },
        })}
      />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
