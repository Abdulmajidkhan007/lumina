/**
 * Lumina — Story viewer screen
 *
 * Placeholder. Full-screen modal with transparent/fade presentation.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';

type StoryParams = { userId: string };

export default function StoryViewerScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams<StoryParams>();

  const dismiss = useCallback(() => router.back(), [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.overlay }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text variant="bodyStrong" color="inverse">
            Story — {userId ?? ''}
          </Text>
          <Pressable
            onPress={dismiss}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Close story"
          >
            <Ionicons name="close-outline" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text variant="callout" color="inverse" align="center">
            Story viewer coming soon.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
