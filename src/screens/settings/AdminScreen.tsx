/**
 * Lumina — In-app Admin panel
 *
 * A mobile view of the activity feed for the admin account
 * (santexnika.atoyo@gmail.com). Shows recent actions with who did what to
 * whom (type + actor email + target from meta). Gated by Firestore rules
 * (only the admin email can read `activityLogs`) and by the Settings entry
 * that leads here.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { fetchRecentActivity, type ActivityLogRecord } from '@/data/services/activityLog';
import { formatRelativeTime } from '@/utils/format';

const LABELS: Record<string, string> = {
  signup: 'signed up',
  login: 'logged in',
  google_login: 'logged in with Google',
  logout: 'logged out',
  account_delete: 'deleted their account',
  account_deactivate: 'deactivated their account',
  post_create: 'created a post',
  story_create: 'added a story',
  follow: 'followed a user',
  unfollow: 'unfollowed a user',
  block: 'blocked a user',
  report: 'reported content',
  professional_switch: 'changed account type',
  password_change: 'changed password',
  password_reset: 'requested password reset',
};

function targetOf(meta: Record<string, string>): string {
  return meta.targetId ?? meta.postId ?? meta.storyId ?? meta.email ?? '';
}

export default function AdminScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const [logs, setLogs] = useState<ActivityLogRecord[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLogs(null);
    try {
      setLogs(await fetchRecentActivity());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ActivityLogRecord }) => {
      const target = targetOf(item.meta);
      return (
        <View style={[styles.row, { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}>
          <View style={styles.rowText}>
            <Text variant="callout" color="primary" numberOfLines={1}>
              <Text variant="callout" color="accent">{item.email ?? 'someone'}</Text>{' '}
              {LABELS[item.type] ?? item.type}
              {target ? <Text variant="callout" color="secondary"> · {target}</Text> : null}
            </Text>
            <Text variant="caption" color="tertiary">
              {item.platform} · {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
            </Text>
          </View>
        </View>
      );
    },
    [theme],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader title="Admin · Activity" onBack={goBack} backAccessibilityLabel="Go back" />
      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : logs === null ? (
        <View style={styles.center}>
          <Spinner size="md" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l) => l.id}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="pulse-outline" title="No activity yet" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { gap: 2 },
});
