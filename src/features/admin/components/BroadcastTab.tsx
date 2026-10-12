import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { Spinner } from '@/design-system/primitives/Spinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  BROADCAST_BODY_MAX,
  BROADCAST_LINK_MAX,
  BROADCAST_TITLE_MAX,
  broadcastFormSchema,
  type Broadcast,
  type BroadcastFormError,
  type BroadcastFormInput,
  type BroadcastFormValues,
} from '@/schemas/broadcast.schema';
import { formatRelativeTime } from '@/utils/format';
import { useDeleteBroadcast, usePublishBroadcast, useRecentBroadcasts } from '../hooks/useAdminData';
import { errorMessage } from './shared';

const ERROR_CODES: readonly BroadcastFormError[] = ['titleRequired', 'titleTooLong', 'bodyRequired', 'bodyTooLong', 'linkInvalid'];

export function BroadcastTab(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const publish = usePublishBroadcast();
  const remove = useDeleteBroadcast();
  const recent = useRecentBroadcasts();
  const [pending, setPending] = useState<BroadcastFormValues | null>(null);
  const [toDelete, setToDelete] = useState<Broadcast | null>(null);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<BroadcastFormInput, unknown, BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: { title: '', body: '', link: '' },
  });

  const fieldError = (message: string | undefined): string | undefined => {
    const code = ERROR_CODES.find((c) => c === message);
    return code ? t(`broadcast.errors.${code}`) : undefined;
  };

  const confirmSend = () => {
    if (!pending) return;
    publish.mutate(pending, {
      onSuccess: () => {
        reset();
        setSent(true);
      },
      onSettled: () => setPending(null),
    });
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('broadcast.titleLabel')}
            value={value}
            onChangeText={(v) => {
              setSent(false);
              onChange(v);
            }}
            onBlur={onBlur}
            maxLength={BROADCAST_TITLE_MAX}
            error={fieldError(formState.errors.title?.message)}
          />
        )}
      />
      <Controller
        control={control}
        name="body"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('broadcast.messageLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={5}
            maxLength={BROADCAST_BODY_MAX}
            hint={`${value.trim().length}/${BROADCAST_BODY_MAX}`}
            error={fieldError(formState.errors.body?.message)}
          />
        )}
      />
      <Controller
        control={control}
        name="link"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('broadcast.linkLabel')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="https://"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={BROADCAST_LINK_MAX}
            error={fieldError(formState.errors.link?.message)}
          />
        )}
      />
      <Button label={t('broadcast.send')} loading={publish.isPending} onPress={handleSubmit((values) => setPending(values))} />
      {sent ? (
        <Text variant="caption" color="success">
          {t('broadcast.sent')}
        </Text>
      ) : null}
      {publish.error || remove.error ? (
        <Text variant="caption" color="danger">
          {errorMessage(publish.error ?? remove.error, t('common.error'))}
        </Text>
      ) : null}
      <Text variant="caption" color="tertiary">
        {t('broadcast.pushNote')}
      </Text>

      <Text variant="bodyStrong" color="primary" style={{ marginTop: theme.spacing.lg }}>
        {t('broadcast.recent')}
      </Text>
      {recent.isLoading ? (
        <Spinner size="sm" />
      ) : (recent.data ?? []).length === 0 ? (
        <Text variant="caption" color="tertiary">
          {t('broadcast.nothingSent')}
        </Text>
      ) : (
        (recent.data ?? []).map((b) => (
          <View
            key={b.id}
            style={[
              styles.card,
              { borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.lg, gap: theme.spacing.xs },
            ]}
          >
            <Text variant="callout" color="primary">
              {b.title}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={3}>
              {b.body}
            </Text>
            {b.link ? (
              <Text variant="caption" color="accent" numberOfLines={1} onPress={() => void Linking.openURL(b.link ?? '')}>
                {b.link}
              </Text>
            ) : null}
            <View style={styles.line}>
              <Text variant="caption" color="tertiary" style={styles.flex}>
                {formatRelativeTime(b.createdAt)}
              </Text>
              <Button label={t('broadcast.delete')} variant="ghost" size="sm" onPress={() => setToDelete(b)} />
            </View>
          </View>
        ))
      )}

      <ConfirmDialog
        visible={pending !== null}
        title={t('broadcast.confirmTitle')}
        message={t('broadcast.confirmMessage')}
        confirmLabel={t('broadcast.send')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmSend}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        visible={toDelete !== null}
        title={t('broadcast.deleteTitle')}
        message={t('broadcast.deleteMessage', { title: toDelete?.title ?? '' })}
        confirmLabel={t('broadcast.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  line: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
