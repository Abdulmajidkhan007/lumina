/**
 * Lumina — Reels tab
 *
 * Immersive fullscreen vertical reels pager. Content fills the entire screen
 * (behind the tab bar). Dark background so the pager blends edge-to-edge.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/primitives/Text';
import { ReelsPager } from '@/features/reels/components';

export default function ReelsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Full-bleed pager — fills behind tab bar */}
      <ReelsPager />

      {/* Floating "Reels" wordmark in the top safe area */}
      <View
        style={[styles.header, { top: insets.top + 8 }]}
        pointerEvents="none"
      >
        <Text variant="headline" style={styles.headerText}>
          Reels
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
