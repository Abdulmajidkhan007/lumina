/**
 * Lumina — Comments modal screen
 *
 * Placeholder. Modal presentation for post comments.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { EmptyState } from '@/components/EmptyState';
import { hitSlop } from '@/constants/layout';

type CommentsParams = { postId: string };

export default function CommentsScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<CommentsParams>();

  const dismiss = useCallback(() => router.back(), [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
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
        <Text variant="bodyStrong" color="primary">
          Comments
        </Text>
        <Pressable
          onPress={dismiss}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Close comments"
          style={styles.closeButton}
        >
          <Ionicons name="close-outline" size={26} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <EmptyState
          icon="chatbubble-outline"
          title={`Comments for post ${postId ?? ''}`}
          subtitle="Comments coming soon."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  body: { flex: 1 },
});
