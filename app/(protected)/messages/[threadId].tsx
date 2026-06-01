/**
 * Lumina — Message thread screen
 *
 * Placeholder. Shows a direct message conversation with a user.
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

type ThreadParams = { threadId: string };

export default function MessageThreadScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { threadId } = useLocalSearchParams<ThreadParams>();

  const goBack = useCallback(() => router.back(), [router]);

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
        <Pressable
          onPress={goBack}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back-outline" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="bodyStrong" color="primary">
          Conversation
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title={`Thread ${threadId ?? ''}`}
          subtitle="Message thread coming soon."
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
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
});
