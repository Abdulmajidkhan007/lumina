/**
 * Lumina — Story viewer screen
 *
 * Fullscreen dark modal that shows a user's story reel. Reads `userId` from
 * the route param, finds the matching StoryReel from the query cache, and
 * renders StoryViewer. Guards all param accesses. Hides the tab bar while open.
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Text } from '@/design-system/primitives/Text';
import { Spinner } from '@/design-system/primitives/Spinner';
import { useStoryReels } from '@/data/query/hooks/useStoryReels';
import { useUiStore } from '@/stores/ui.store';
import { StoryViewer } from '@/features/stories/components/StoryViewer';

// ---------------------------------------------------------------------------
// Route param types
// ---------------------------------------------------------------------------

type StoryParams = {
  userId: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function StoryViewerScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<StoryParams>();
  const userId = params.userId ?? null;

  const setTabBarVisible = useUiStore((s) => s.setTabBarVisible);
  const resetStoryViewer = useUiStore((s) => s.resetStoryViewer);

  const { data: reels, isLoading } = useStoryReels();

  // Hide tab bar while viewing story; restore on unmount
  useEffect(() => {
    setTabBarVisible(false);
    return () => {
      setTabBarVisible(true);
      resetStoryViewer();
    };
  }, [setTabBarVisible, resetStoryViewer]);

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  // Guard: no userId
  if (userId == null) {
    return (
      <View style={styles.fallback}>
        <Text variant="callout" color="inverse" align="center">
          Story not found.
        </Text>
      </View>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <View style={styles.fallback}>
        <Spinner size="md" colorVariant="inverse" />
      </View>
    );
  }

  // Find the matching reel
  const reel = reels?.find((r) => r.author.id === userId) ?? null;

  if (reel == null) {
    return (
      <View style={styles.fallback}>
        <Text variant="callout" color="inverse" align="center">
          No stories found for this user.
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <StoryViewer reel={reel} onDismiss={dismiss} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
