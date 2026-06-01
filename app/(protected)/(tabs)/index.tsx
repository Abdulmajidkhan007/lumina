/**
 * Lumina — Home (Feed) tab
 *
 * Placeholder screen. Will be replaced by the full feed feature.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { tabBarHeight } from '@/constants/layout';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Screen header */}
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
          Lumina
        </Text>
      </View>

      {/* Body */}
      <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
        <EmptyState
          icon="images-outline"
          title="Your feed is empty"
          subtitle="Follow people to see their posts here."
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
