/**
 * Lumina — CaptionForm
 *
 * React Hook Form powered Step 2 details form.
 * - Multiline caption TextInput with live char count
 * - Add location placeholder row
 * - Tag people placeholder row
 * - "Also share to…" toggle section (placeholder)
 *
 * The form instance is created in the parent (create-post.tsx) and passed
 * down via props so the parent can call handleSubmit directly.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme , Text , Divider , Avatar } from '@/design-system';
import { hitSlop } from '@/constants/layout';
import { Config } from '@/constants/config';
import type { CreatePostFormValues } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaptionFormProps {
  control: Control<CreatePostFormValues>;
  errors: FieldErrors<CreatePostFormValues>;
  /** Current user avatar URI for the composer row */
  avatarUri?: string;
  /** Current user display name */
  displayName?: string;
}

// ---------------------------------------------------------------------------
// ActionRow — generic tappable row in the details list
// ---------------------------------------------------------------------------

interface ActionRowProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

const ActionRow = React.memo(function ActionRow({
  icon,
  label,
  onPress,
}: ActionRowProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
        },
      ]}
    >
      <Text variant="callout" color="primary" style={styles.actionRowLabel}>
        {label}
      </Text>
      <Ionicons
        name={icon}
        size={18}
        color={theme.colors.textTertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// ToggleRow — row with a Switch (placeholder shares)
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

const ToggleRow = React.memo(function ToggleRow({
  label,
  value,
  onValueChange,
}: ToggleRowProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.toggleRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <Text variant="callout" color="primary" style={styles.toggleLabel}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.accent,
        }}
        thumbColor={theme.colors.surface}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// CaptionForm
// ---------------------------------------------------------------------------

export function CaptionForm({
  control,
  errors,
  avatarUri,
  displayName,
}: CaptionFormProps): React.JSX.Element {
  const theme = useTheme();

  // Placeholder toggle states (not wired to any real functionality)
  const [shareToFacebook, setShareToFacebook] = React.useState(false);
  const [shareToTwitter, setShareToTwitter] = React.useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ---- Caption row ---- */}
      <View
        style={[
          styles.captionRow,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Avatar
          uri={avatarUri}
          displayName={displayName}
          size="sm"
          style={styles.captionAvatar}
          accessibilityLabel="Your avatar"
        />

        <Controller
          control={control}
          name="caption"
          render={({ field: { onChange, onBlur, value } }) => {
            const charCount = value?.length ?? 0;
            const remaining = Config.MAX_CAPTION_LENGTH - charCount;
            const isNearLimit = remaining <= 200;

            return (
              <View style={styles.captionInputWrapper}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Write a caption…"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  maxLength={Config.MAX_CAPTION_LENGTH}
                  style={[
                    styles.captionInput,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.callout.fontSize,
                      lineHeight: theme.typography.callout.lineHeight,
                    },
                  ]}
                  accessibilityLabel="Post caption"
                  accessibilityHint={`Up to ${Config.MAX_CAPTION_LENGTH} characters`}
                  textAlignVertical="top"
                />
                {isNearLimit ? (
                  <Text
                    variant="overline"
                    color={remaining < 0 ? 'danger' : 'tertiary'}
                    align="right"
                    style={styles.charCount}
                  >
                    {remaining}
                  </Text>
                ) : null}
                {errors.caption ? (
                  <Text variant="caption" color="danger" style={styles.errorText}>
                    {errors.caption.message}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />
      </View>

      <Divider />

      {/* ---- Location row ---- */}
      <ActionRow
        icon="chevron-forward"
        label="Add location"
        onPress={() => {
          // TODO: location picker
        }}
      />

      <Divider mx={16} />

      {/* ---- Tag people row ---- */}
      <ActionRow
        icon="chevron-forward"
        label="Tag people"
        onPress={() => {
          // TODO: tag people
        }}
      />

      <Divider />

      {/* ---- Also share to section ---- */}
      <View
        style={[
          styles.sectionHeader,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xs,
          },
        ]}
      >
        <Text variant="caption" color="secondary">
          ALSO SHARE TO
        </Text>
      </View>

      <ToggleRow
        label="Facebook"
        value={shareToFacebook}
        onValueChange={setShareToFacebook}
      />

      <Divider mx={16} />

      <ToggleRow
        label="Twitter / X"
        value={shareToTwitter}
        onValueChange={setShareToTwitter}
      />

      <Divider />

      {/* Bottom spacer for keyboard */}
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 80,
  },
  captionAvatar: {
    marginTop: 2,
    marginRight: 12,
    flexShrink: 0,
  },
  captionInputWrapper: {
    flex: 1,
  },
  captionInput: {
    minHeight: 72,
    paddingTop: 0,
    paddingBottom: 0,
  },
  charCount: {
    marginTop: 4,
  },
  errorText: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRowLabel: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    flex: 1,
  },
  sectionHeader: {
    // padding applied inline
  },
});
