/** Modal asking for a short (required) reason before a moderation action. */
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';

interface ReasonModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReasonModal({ visible, title, message, confirmLabel, loading, onConfirm, onCancel }: ReasonModalProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.scrim, { backgroundColor: theme.colors.overlay, padding: theme.spacing.xl }]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.xl,
              gap: theme.spacing.md,
            },
          ]}
        >
          <Text variant="bodyStrong" color="primary">
            {title}
          </Text>
          <Text variant="callout" color="secondary">
            {message}
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={t('users.reasonPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            maxLength={500}
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
          <View style={[styles.actions, { gap: theme.spacing.sm }]}>
            <Button label={t('common.cancel')} variant="secondary" size="sm" onPress={onCancel} />
            <Button
              label={confirmLabel}
              variant="danger"
              size="sm"
              loading={loading}
              disabled={reason.trim().length === 0}
              onPress={() => onConfirm(reason.trim())}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 440 },
  input: { borderWidth: 1, minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
