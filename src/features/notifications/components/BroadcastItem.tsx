/** An admin announcement row in the Notifications list. */
import React, { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { formatRelativeTime } from '@/utils/format';
import type { BroadcastItem as BroadcastItemModel } from '../hooks/useBroadcasts';

export function BroadcastItem({ broadcast }: { broadcast: BroadcastItemModel }): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const openLink = useCallback(() => {
    if (broadcast.link) void Linking.openURL(broadcast.link);
  }, [broadcast.link]);

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          backgroundColor: broadcast.read ? theme.colors.background : theme.colors.surface,
          borderLeftColor: broadcast.read ? 'transparent' : theme.colors.accent,
        },
      ]}
      accessibilityLabel={`${t('notifications.announcement')}: ${broadcast.title}`}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.full }]}>
        <Ionicons name="megaphone-outline" size={18} color={theme.colors.accent} />
      </View>
      <View style={[styles.body, { gap: theme.spacing.xxs }]}>
        <Text variant="overline" color="accent">
          {t('notifications.announcement')} · {formatRelativeTime(broadcast.createdAt)}
        </Text>
        <Text variant="callout" color="primary">
          {broadcast.title}
        </Text>
        <Text variant="caption" color="secondary">
          {broadcast.body}
        </Text>
        {broadcast.link ? (
          <Pressable accessibilityRole="link" onPress={openLink}>
            <Text variant="caption" color="accent">
              {t('notifications.openLink')} ↗
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});
