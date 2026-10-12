/**
 * Lumina — In-app Admin panel
 *
 * The same sections as the web admin (/admin): Overview (DAU, sign-ups and
 * posts per day, open reports), Reports (review flow with audit trail),
 * Users (search, roles, blocks), Activity (admin journal + user events) and
 * Broadcast (announcements to every user — admins only). Moderators see the
 * first four. Firestore rules enforce every permission server-side; the
 * Settings entry that leads here is only shown to staff.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { ProtectedStackParamList } from '@/navigation';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import type { AdminReport } from '@/data/services/admin';
import { useOwnRole } from '@/features/admin/hooks/useAdminData';
import { OverviewTab } from '@/features/admin/components/OverviewTab';
import { ReportsTab } from '@/features/admin/components/ReportsTab';
import { UsersTab } from '@/features/admin/components/UsersTab';
import { ActivityTab } from '@/features/admin/components/ActivityTab';
import { BroadcastTab } from '@/features/admin/components/BroadcastTab';
import { TabLoading } from '@/features/admin/components/shared';

type Tab = 'overview' | 'reports' | 'users' | 'activity' | 'broadcast';
const TABS: readonly { key: Tab; adminOnly: boolean }[] = [
  { key: 'overview', adminOnly: false },
  { key: 'reports', adminOnly: false },
  { key: 'users', adminOnly: false },
  { key: 'activity', adminOnly: false },
  { key: 'broadcast', adminOnly: true },
];

export default function AdminScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: role } = useOwnRole();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const tabs = useMemo(() => TABS.filter((x) => role === 'admin' || !x.adminOnly), [role]);

  const openTarget = useCallback(
    (report: AdminReport) => {
      if (report.targetType === 'user') navigation.navigate('UserProfile', { id: report.targetId });
      else if (report.targetType === 'post') navigation.navigate('PostDetail', { id: report.targetId });
    },
    [navigation],
  );

  const title = role === 'moderator' ? `${t('title')} · ${t('roleModerator')}` : t('title');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader title={title} onBack={goBack} backAccessibilityLabel="Go back" />
      <View style={[styles.tabsBar, { borderBottomColor: theme.colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((x) => (
            <Pressable
              key={x.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === x.key }}
              onPress={() => setTab(x.key)}
              style={[
                styles.tab,
                { paddingHorizontal: theme.spacing.lg },
                tab === x.key && { borderBottomColor: theme.colors.accent },
              ]}
            >
              <Text variant="callout" color={tab === x.key ? 'primary' : 'secondary'}>
                {t(`tabs.${x.key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {role === undefined ? <TabLoading /> : null}
      {role !== undefined && tab === 'overview' ? <OverviewTab /> : null}
      {role !== undefined && tab === 'reports' ? <ReportsTab onOpenTarget={openTarget} /> : null}
      {role !== undefined && tab === 'users' ? <UsersTab actorRole={role} /> : null}
      {role !== undefined && tab === 'activity' ? <ActivityTab /> : null}
      {role === 'admin' && tab === 'broadcast' ? <BroadcastTab /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabsBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { flexGrow: 1 },
  tab: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
});
