/**
 * Lumina — In-app Admin panel
 *
 * Mobile admin panel for the admin account (santexnika.atoyo@gmail.com) —
 * the same four views as the web admin: Overview (counts), Reports (the
 * moderation queue: action / dismiss), Users (newest accounts, searchable)
 * and Activity (recent auth/social events). Gated by Firestore rules (only
 * the verified admin email can read reports/activityLogs) and by the
 * Settings entry that leads here.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import {
  fetchOverviewStats,
  fetchRecentUsers,
  fetchReports,
  fetchResolvedReportIds,
  resolveReport,
  type AdminReport,
  type AdminUserRow,
  type OverviewStats,
} from '@/data/services/adminService';

type Tab = 'overview' | 'reports' | 'users' | 'activity';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
  { key: 'activity', label: 'Activity' },
];

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

function ActivityTab(): React.JSX.Element {
  const theme = useTheme();
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

  const renderItem = useCallback(
    ({ item }: { item: ActivityLogRecord }) => {
      const target = targetOf(item.meta);
      return (
        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
          ]}
        >
          <View style={styles.rowText}>
            <Text variant="callout" color="primary" numberOfLines={1}>
              <Text variant="callout" color="accent">
                {item.email ?? 'someone'}
              </Text>{' '}
              {LABELS[item.type] ?? item.type}
              {target ? (
                <Text variant="callout" color="secondary">
                  {' '}
                  · {target}
                </Text>
              ) : null}
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

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (logs === null) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }
  return (
    <FlatList
      data={logs}
      keyExtractor={(l) => l.id}
      renderItem={renderItem}
      ListEmptyComponent={<EmptyState icon="pulse-outline" title="No activity yet" />}
    />
  );
}

/** Loads once on mount; `reload` re-runs the loader. */
function useLoad<T>(loader: () => Promise<T>): {
  data: T | null;
  error: string;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const run = useCallback(async () => {
    setError('');
    setData(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    }
  }, [loader]);
  useEffect(() => {
    void run();
  }, [run]);
  return { data, error, reload: () => void run() };
}

function OverviewTab(): React.JSX.Element {
  const theme = useTheme();
  const { data, error, reload } = useLoad<OverviewStats>(fetchOverviewStats);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }
  const cards: [string, number][] = [
    ['Total users', data.totalUsers],
    ['Total posts', data.totalPosts],
    ['Activity today', data.activityToday],
    ['Open reports', data.openReports],
  ];
  return (
    <ScrollView contentContainerStyle={[styles.grid, { padding: theme.spacing.lg }]}>
      {cards.map(([label, value]) => (
        <View
          key={label}
          style={[
            styles.card,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="caption" color="secondary">
            {label}
          </Text>
          <Text variant="title" color="primary">
            {String(value)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ReportsTab(): React.JSX.Element {
  const theme = useTheme();
  const loader = useCallback(async () => {
    const reports = await fetchReports();
    const resolved = await fetchResolvedReportIds(reports.map((r) => r.id));
    return { reports, resolved };
  }, []);
  const { data, error, reload } = useLoad(loader);
  const [busy, setBusy] = useState<string | null>(null);
  const [decided, setDecided] = useState<Set<string>>(new Set());

  const decide = async (id: string, outcome: 'dismissed' | 'actioned'): Promise<void> => {
    setBusy(id);
    try {
      await resolveReport(id, outcome);
      setDecided((prev) => new Set(prev).add(id));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }
  const renderReport = ({ item }: { item: AdminReport }): React.JSX.Element => {
    const isResolved = data.resolved.has(item.id) || decided.has(item.id);
    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Text variant="callout" color="primary">
          {item.targetType} · {item.targetId}
        </Text>
        <Text variant="callout" color="secondary">
          {item.reason || '—'}
        </Text>
        <Text variant="caption" color="tertiary">
          {formatRelativeTime(item.createdAt)} · {isResolved ? 'resolved' : 'open'}
        </Text>
        {!isResolved ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={busy === item.id}
              onPress={() => void decide(item.id, 'actioned')}
              style={[styles.pill, { backgroundColor: theme.colors.danger }]}
            >
              <Text variant="caption" color="inverse">
                Action
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy === item.id}
              onPress={() => void decide(item.id, 'dismissed')}
              style={[styles.pill, { borderColor: theme.colors.border, borderWidth: 1 }]}
            >
              <Text variant="caption" color="primary">
                Dismiss
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };
  return (
    <FlatList
      data={data.reports}
      keyExtractor={(r) => r.id}
      renderItem={renderReport}
      ListEmptyComponent={<EmptyState icon="flag-outline" title="No reports" />}
    />
  );
}

function UsersTab(): React.JSX.Element {
  const theme = useTheme();
  const { data, error, reload } = useLoad<AdminUserRow[]>(fetchRecentUsers);
  const [search, setSearch] = useState('');
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }
  const q = search.trim().toLowerCase();
  const rows = q
    ? data.filter(
        (u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q),
      )
    : data;
  return (
    <FlatList
      data={rows}
      keyExtractor={(u) => u.id}
      ListHeaderComponent={
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users"
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
          style={[
            styles.search,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
              margin: theme.spacing.lg,
            },
          ]}
        />
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
          ]}
        >
          <Text variant="callout" color="primary">
            {item.displayName}{' '}
            <Text variant="callout" color="secondary">
              @{item.username}
            </Text>
          </Text>
          <Text variant="caption" color="tertiary">
            {item.postCount} posts · {item.followerCount} followers · joined{' '}
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="people-outline" title="No users" />}
    />
  );
}

export default function AdminScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const [tab, setTab] = useState<Tab>('overview');
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader title="Admin" onBack={goBack} backAccessibilityLabel="Go back" />
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && { borderBottomColor: theme.colors.accent }]}
          >
            <Text variant="callout" color={tab === t.key ? 'primary' : 'secondary'}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'overview' ? <OverviewTab /> : null}
      {tab === 'reports' ? <ReportsTab /> : null}
      {tab === 'users' ? <UsersTab /> : null}
      {tab === 'activity' ? <ActivityTab /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { gap: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
});
