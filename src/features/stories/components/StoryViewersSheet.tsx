/**
 * Lumina — StoryViewersSheet
 *
 * Bottom sheet listing who viewed one of your stories (avatar, username,
 * relative time). Loading / empty / error states included. Only the author
 * can read the list (Firestore rules), so it is only mounted on own stories.
 */

import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Sheet } from '@/design-system/primitives/Sheet';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { formatRelativeTime } from '@/utils/format';
import type { StoryView } from '@/types/models';

export interface StoryViewersSheetProps {
  visible: boolean;
  onDismiss: () => void;
  viewers: StoryView[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewerPress: (userId: string) => void;
}

export function StoryViewersSheet({
  visible,
  onDismiss,
  viewers,
  isLoading,
  isError,
  onRetry,
  onViewerPress,
}: StoryViewersSheetProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: StoryView }) => (
      <Pressable
        onPress={() => onViewerPress(item.viewer.id)}
        accessibilityRole="button"
        accessibilityLabel={item.viewer.username}
        style={({ pressed }) => [
          styles.row,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            gap: theme.spacing.md,
            backgroundColor: pressed ? theme.colors.surface : 'transparent',
          },
        ]}
      >
        <Avatar
          uri={item.viewer.avatarUrl ?? undefined}
          displayName={item.viewer.displayName}
          size="md"
        />
        <View style={styles.rowText}>
          <Text variant="bodyStrong" color="primary" numberOfLines={1}>
            {item.viewer.username}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {item.viewer.displayName}
          </Text>
        </View>
        <Text variant="caption" color="tertiary">
          {formatRelativeTime(item.viewedAt)}
        </Text>
      </Pressable>
    ),
    [onViewerPress, theme],
  );

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={[styles.state, { padding: theme.spacing['2xl'] }]}>
        <Spinner size="md" />
      </View>
    );
  } else if (isError) {
    body = (
      <View style={[styles.state, { padding: theme.spacing.xl, gap: theme.spacing.md }]}>
        <Text variant="callout" color="secondary" align="center">
          {t('storyViewer.viewersError')}
        </Text>
        <Button label={t('common.retry')} variant="secondary" size="sm" onPress={onRetry} />
      </View>
    );
  } else if (!viewers || viewers.length === 0) {
    body = (
      <View style={[styles.state, { padding: theme.spacing.xl, gap: theme.spacing.xs }]}>
        <Text variant="bodyStrong" color="primary" align="center">
          {t('storyViewer.noViewers')}
        </Text>
        <Text variant="caption" color="secondary" align="center">
          {t('storyViewer.noViewersHint')}
        </Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={viewers}
        keyExtractor={(v) => v.viewer.id}
        renderItem={renderItem}
        style={styles.list}
      />
    );
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} maxHeightFraction={0.7}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}>
        <Text variant="bodyStrong" color="primary">
          {t('storyViewer.viewersTitle')}
        </Text>
        {viewers && viewers.length > 0 ? (
          <Text variant="callout" color="secondary">
            {viewers.length}
          </Text>
        ) : null}
      </View>
      {body}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
});
