/**
 * Lumina — Insights (professional dashboard)
 *
 * A lightweight analytics view for professional accounts. Computes real
 * numbers from the current user's own posts (likes/comments totals, averages,
 * top post) alongside their follower/following/post counts. No fabricated
 * "reach"/"impression" metrics — only figures we can derive from real data.
 */

import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Spinner } from '@/design-system/primitives/Spinner';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { postsApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { formatCount } from '@/utils/format';
import { queryKeys } from '@/data/query/keys';

function StatCard({ label, value }: { label: string; value: string }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl },
      ]}
    >
      <Text variant="headline" color="primary">
        {value}
      </Text>
      <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function InsightsScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.feedUser(currentUser?.id ?? ('' as never)), 'insights'],
    queryFn: () => postsApi.getUserPosts(currentUser!.id, { limit: 50 }),
    enabled: !!currentUser,
  });

  const stats = useMemo(() => {
    const posts = data?.items ?? [];
    const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);
    const top = posts.reduce<typeof posts[number] | null>(
      (best, p) => (best === null || p.likeCount > best.likeCount ? p : best),
      null,
    );
    return {
      count: posts.length,
      totalLikes,
      totalComments,
      avgLikes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
      top,
    };
  }, [data]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader title="Insights" onBack={goBack} backAccessibilityLabel="Go back" />
      {isLoading ? (
        <View style={styles.center}>
          <Spinner size="md" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Text variant="bodyStrong" color="primary">
            Audience
          </Text>
          <View style={styles.grid}>
            <StatCard label="Followers" value={formatCount(currentUser?.followerCount ?? 0)} />
            <StatCard label="Following" value={formatCount(currentUser?.followingCount ?? 0)} />
            <StatCard label="Posts" value={formatCount(currentUser?.postCount ?? 0)} />
          </View>

          <Text variant="bodyStrong" color="primary" style={{ marginTop: theme.spacing.md }}>
            Content (recent {stats.count} posts)
          </Text>
          <View style={styles.grid}>
            <StatCard label="Total likes" value={formatCount(stats.totalLikes)} />
            <StatCard label="Total comments" value={formatCount(stats.totalComments)} />
            <StatCard label="Avg likes/post" value={formatCount(stats.avgLikes)} />
          </View>

          {stats.top ? (
            <View
              style={[
                styles.topPost,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl },
              ]}
            >
              <Text variant="caption" color="secondary">
                Top post
              </Text>
              <Text variant="callout" color="primary" numberOfLines={2} style={{ marginTop: 4 }}>
                {stats.top.caption ?? '(no caption)'}
              </Text>
              <Text variant="caption" color="accent" style={{ marginTop: 4 }}>
                {formatCount(stats.top.likeCount)} likes · {formatCount(stats.top.commentCount)} comments
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, borderWidth: StyleSheet.hairlineWidth, padding: 14, alignItems: 'flex-start' },
  topPost: { borderWidth: StyleSheet.hairlineWidth, padding: 14, marginTop: 4 },
});
