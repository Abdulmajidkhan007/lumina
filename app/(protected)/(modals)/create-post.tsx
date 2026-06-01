/**
 * Lumina — Create Post modal
 *
 * Placeholder for the create-post flow. Will be replaced by the full
 * media picker + caption + share feature.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { hitSlop } from '@/constants/layout';

export default function CreatePostModal(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="bodyStrong" color="primary">
          New post
        </Text>
        <Pressable
          onPress={dismiss}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeButton}
        >
          <Ionicons
            name="close-outline"
            size={28}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <EmptyState
          icon="camera-outline"
          title="Share a moment"
          subtitle="Photo and video uploads are coming soon."
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
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  body: {
    flex: 1,
  },
});
