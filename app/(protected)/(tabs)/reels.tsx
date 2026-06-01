/**
 * Lumina — Reels tab
 *
 * Placeholder screen. Will be replaced by the full reels feature.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { tabBarHeight } from '@/constants/layout';

export default function ReelsScreen(): React.JSX.Element {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="headline" color="primary">
          Reels
        </Text>
      </View>

      <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
        <EmptyState
          icon="play-circle-outline"
          title="No reels yet"
          subtitle="Short videos from people you follow will appear here."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
  },
});
