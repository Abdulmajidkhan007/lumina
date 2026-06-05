/**
 * Lumina — Other user profile screen
 *
 * Fetches user by [id] param via useUser(). Renders shared ProfileHeader +
 * ProfileTabs + ProfilePostGrid. Guards the id param.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { SkeletonProfileHeader } from '@/design-system/primitives/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useUser } from '@/data/query/hooks/useUser';
import { hitSlop } from '@/constants/layout';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTabs } from '@/features/profile/components/ProfileTabs';
import { ProfilePostGrid } from '@/features/profile/components/ProfilePostGrid';
import type { ProfileTab } from '@/features/profile/components/ProfileTabs';
import type { UserId } from '@/types/models';
import { userIdSchema } from '@/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseUserId(raw: string | string[] | undefined): UserId | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  const result = userIdSchema.safeParse(str);
  return result.success ? result.data : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type UserParams = { id: string };

export default function UserProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<UserParams>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const userId = parseUserId(rawId);
  const { data: user, isLoading, isError, refetch } = useUser(
    userId as UserId,
  );

  const goBack = useCallback(() => router.back(), [router]);

  const goToFollowers = useCallback(() => {
    if (userId) {
      router.push(`/(protected)/user/${userId}/followers`);
    }
  }, [router, userId]);

  const goToFollowing = useCallback(() => {
    if (userId) {
      router.push(`/(protected)/user/${userId}/following`);
    }
  }, [router, userId]);

  const goToMessage = useCallback(() => {
    // TODO: navigate to DM thread
    router.push('/(protected)/messages/index');
  }, [router]);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  // Guard: invalid id
  if (userId === null) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <NavHeader title="Profile" onBack={goBack} theme={theme} />
        <View style={styles.body}>
          <ErrorState message="User not found." />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user?.username ?? 'Profile';

  const listHeader = (
    <>
      {isLoading ? (
        <SkeletonProfileHeader />
      ) : user ? (
        <ProfileHeader
          user={user}
          onMessage={goToMessage}
          onFollowersPress={goToFollowers}
          onFollowingPress={goToFollowing}
        />
      ) : null}
      <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <NavHeader title={displayName} onBack={goBack} theme={theme} />

      {isError ? (
        <View style={styles.body}>
          <ErrorState
            message="Couldn't load this profile."
            onRetry={() => void refetch()}
          />
        </View>
      ) : activeTab === 'posts' && userId ? (
        <View style={styles.body}>
          <ProfilePostGrid userId={userId} ListHeaderComponent={listHeader} />
        </View>
      ) : (
        <View style={styles.body}>
          {listHeader}
          <EmptyState
            icon={activeTab === 'reels' ? 'film-outline' : 'person-add-outline'}
            title={activeTab === 'reels' ? 'No reels yet' : 'Not tagged yet'}
            subtitle={
              activeTab === 'reels'
                ? "This user hasn't shared any reels."
                : "Posts they're tagged in will appear here."
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// NavHeader — shared header subcomponent
// ---------------------------------------------------------------------------

interface NavHeaderProps {
  title: string;
  onBack: () => void;
  theme: ReturnType<typeof useTheme>;
}

function NavHeader({ title, onBack, theme }: NavHeaderProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.navHeader,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={hitSlop.md}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>
      <Text variant="bodyStrong" color="primary">
        {title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
});
