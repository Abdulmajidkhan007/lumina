import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { Spinner } from '@/design-system/primitives/Spinner';
import type { AdminReport } from '@/data/services/admin';
import { isClosedStatus, nextReportStatuses } from '@/utils/admin';
import { formatRelativeTime } from '@/utils/format';
import { useReportAction, useReportTrail, type ReportAction } from '../hooks/useAdminData';
import { StatusPill } from './AdminPrimitives';
import { STATUS_TONE } from './reportTone';
import { errorMessage } from './shared';

interface ReportDetailProps {
  report: AdminReport;
  onBack?: () => void;
  onOpenTarget: (report: AdminReport) => void;
}

export function ReportDetail({ report, onBack, onOpenTarget }: ReportDetailProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [note, setNote] = useState('');
  const trail = useReportTrail(report.id);
  const action = useReportAction(report);

  const run = (a: ReportAction) => action.mutate(a, { onSuccess: () => setNote('') });
  const statusText = (s: AdminReport['status']) => t(`reports.statuses.${s}`);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text variant="callout" color="accent">
            ← {t('reports.back')}
          </Text>
        </Pressable>
      ) : null}
      <View style={[styles.line, { gap: theme.spacing.sm }]}>
        <Text variant="headline" color="primary" style={styles.flex}>
          {t(`reports.targets.${report.targetType}`)}
        </Text>
        <StatusPill tone={STATUS_TONE[report.status]} label={statusText(report.status)} />
      </View>
      {report.targetType !== 'comment' ? (
        <Pressable accessibilityRole="link" onPress={() => onOpenTarget(report)}>
          <Text variant="caption" color="accent" numberOfLines={1}>
            {t('reports.openTarget')} · {report.targetId}
          </Text>
        </Pressable>
      ) : (
        <Text variant="caption" color="tertiary" numberOfLines={1}>
          {report.targetId}
        </Text>
      )}
      <Text variant="callout" color="primary">
        {t('reports.reason')}: <Text variant="callout" color="secondary">{report.reason || '—'}</Text>
      </Text>
      <Text variant="caption" color="tertiary">
        {t('reports.filed')}: {formatRelativeTime(report.createdAt)} · {t('reports.reporter')}: {report.reporterId || '—'}
      </Text>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('reports.notePlaceholder')}
        placeholderTextColor={theme.colors.textTertiary}
        maxLength={1000}
        multiline
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            padding: theme.spacing.md,
            fontSize: theme.typography.callout.fontSize,
          },
        ]}
      />
      <View style={[styles.line, styles.wrap, { gap: theme.spacing.sm }]}>
        {nextReportStatuses(report.status).map((to) => (
          <Button
            key={to}
            size="sm"
            variant={to === 'resolved' ? 'primary' : 'secondary'}
            disabled={action.isPending}
            label={to === 'reviewing' && isClosedStatus(report.status) ? t('reports.reopen') : t('reports.mark', { status: statusText(to) })}
            onPress={() => run({ kind: 'status', to, note })}
          />
        ))}
        <Button
          size="sm"
          variant="ghost"
          label={t('reports.addNote')}
          disabled={action.isPending || note.trim().length === 0}
          onPress={() => run({ kind: 'note', note })}
        />
      </View>
      <View style={[styles.line, styles.wrap, { gap: theme.spacing.sm }]}>
        {report.targetType === 'post' ? (
          <Button size="sm" variant="danger" label={t('reports.hidePost')} disabled={action.isPending} onPress={() => run({ kind: 'hide_post', note })} />
        ) : null}
        {report.targetType !== 'comment' ? (
          <Button
            size="sm"
            variant="danger"
            label={report.targetType === 'post' ? t('reports.blockAuthor') : t('reports.blockUser')}
            disabled={action.isPending}
            onPress={() => run({ kind: 'ban_user', note })}
          />
        ) : null}
      </View>
      {action.error ? (
        <Text variant="caption" color="danger">
          {errorMessage(action.error, t('common.error'))}
        </Text>
      ) : null}

      <Text variant="bodyStrong" color="primary">
        {t('reports.trail')}
      </Text>
      {trail.isLoading ? (
        <Spinner size="sm" />
      ) : (trail.data ?? []).length === 0 ? (
        <Text variant="caption" color="tertiary">
          {t('reports.noTrail')}
        </Text>
      ) : (
        <View style={[styles.trail, { borderLeftColor: theme.colors.border, paddingLeft: theme.spacing.md, gap: theme.spacing.sm }]}>
          {(trail.data ?? []).map((e) => (
            <View key={e.id}>
              <Text variant="callout" color="primary">
                {t(`reports.trailActions.${e.action}`)}
                {e.status ? <Text variant="callout" color="secondary"> → {statusText(e.status)}</Text> : null}
              </Text>
              {e.note ? (
                <Text variant="caption" color="secondary">
                  “{e.note}”
                </Text>
              ) : null}
              <Text variant="caption" color="tertiary">
                {e.moderator} · {e.createdAt ? formatRelativeTime(e.createdAt) : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  input: { borderWidth: 1, minHeight: 64, textAlignVertical: 'top' },
  trail: { borderLeftWidth: 1 },
});
