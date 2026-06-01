/**
 * Lumina — Home (Feed) tab
 *
 * Gradient wordmark header + horizontal StoryRail (inside FeedList as
 * ListHeaderComponent) + infinite-scroll PostCard feed.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { FeedHeader } from '@/features/feed/components/FeedHeader';
import { FeedList } from '@/features/feed/components/FeedList';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FeedHeader />
      <FeedList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
