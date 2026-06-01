/**
 * Lumina — Own profile tab screen
 *
 * Reads current user from useCurrentUser (Zustand).
 * Renders shared ProfileHeader + ProfileTabs + ProfilePostGrid.
 * Gear icon in header navigates to settings.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { SkeletonProfileHeader } from '@/design-system/primitives/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useCurrentUser } from '@/stores/auth.store';
import { hitSlop, tabBarHeight } from '@/constants/layout';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTabs } from '@/features/profile/components/ProfileTabs';
import { ProfilePostGrid } from '@/features/profile/components/ProfilePostGrid';
import type { ProfileTab } from '@/features/profile/components/ProfileTabs';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const goToSettings = useCallback(() => {
    router.push('/(protected)/settings/index');
  }, [router]);

  const goToEditProfile = useCallback(() => {
    router.push('/(protected)/settings/edit-profile');
  }, [router]);

  const goToFollowers = useCallback(() => {
    if (currentUser) {
      router.push(`/(protected)/user/${currentUser.id}/followers`);
    }
  }, [router, currentUser]);

  const goToFollowing = useCallback(() => {
    if (currentUser) {
      router.push(`/(protected)/user/${currentUser.id}/following`);
    }
  }, [router, currentUser]);

  const handleShareProfile = useCallback(() => {
    // TODO: share sheet
  }, []);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  const header = (
    <>
      {currentUser ? (
        <ProfileHeader
          user={currentUser}
          onEditProfile={goToEditProfile}
          onShareProfile={handleShareProfile}
          onFollowersPress={goToFollowers}
          onFollowingPress={goToFollowing}
        />
      ) : (
        <SkeletonProfileHeader />
      )}
      <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Navigation Header */}
      <View
        style={[
          styles.navHeader,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="headline" color="primary">
          {currentUser?.username ?? 'Profile'}
        </Text>
        <Pressable
          onPress={goToSettings}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Content */}
      {!currentUser ? (
        <View style={styles.body}>
          <EmptyState
            icon="person-circle-outline"
            title="Your profile"
            subtitle="Your posts and information will appear here."
          />
        </View>
      ) : activeTab === 'posts' ? (
        <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
          <ProfilePostGrid
            userId={currentUser.id}
            ListHeaderComponent={header}
          />
        </View>
      ) : (
        <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
          {header}
          <EmptyState
            icon={activeTab === 'reels' ? 'film-outline' : 'person-add-outline'}
            title={activeTab === 'reels' ? 'No reels yet' : 'Not tagged yet'}
            subtitle={
              activeTab === 'reels'
                ? "Your reels will appear here."
                : "Posts you're tagged in will appear here."
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
  },
});
