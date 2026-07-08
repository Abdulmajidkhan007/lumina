/**
 * Lumina — Edit Profile screen
 *
 * React Hook Form + zodResolver(editProfileSchema).
 * Fields: displayName, username, bio (multiline + char count), isPrivate switch.
 * Avatar with "Change photo" affordance (// TODO: real picker).
 * Save performs an optimistic update (// TODO: persist via mutation).
 */

import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Button } from '@/design-system/primitives/Button';
import { Divider } from '@/design-system/primitives/Divider';
import { Spinner } from '@/design-system/primitives/Spinner';
import { useCurrentUser } from '@/stores/auth.store';
import { editProfileSchema } from '@/schemas';
import type { EditProfileInput } from '@/types/forms';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BIO_MAX = 150;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: currentUser?.displayName ?? '',
      username: currentUser?.username ?? '',
      bio: currentUser?.bio ?? '',
      isPrivate: currentUser?.isPrivate ?? false,
    },
  });

  // Sync form defaults when currentUser loads
  useEffect(() => {
    if (currentUser) {
      reset({
        displayName: currentUser.displayName,
        username: currentUser.username,
        bio: currentUser.bio ?? '',
        isPrivate: currentUser.isPrivate,
      });
    }
  }, [currentUser, reset]);

  const bioValue = watch('bio') ?? '';

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSubmit = useCallback(
    async (_data: EditProfileInput) => {
      // TODO: call mutation to persist profile update
      // For now, show a brief success alert and navigate back
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    },
    [navigation],
  );

  const handleChangePhoto = useCallback(() => {
    // TODO: launch image picker
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Navigation Header */}
      <View
        style={[
          styles.navHeader,
          {
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text variant="bodyStrong" color="primary">
          Edit Profile
        </Text>
        {isSubmitting ? (
          <Spinner size="sm" />
        ) : (
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isSubmitting}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            accessibilityState={{ disabled: !isDirty || isSubmitting }}
          >
            <Text
              variant="bodyStrong"
              color={isDirty ? 'accent' : 'tertiary'}
            >
              Save
            </Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={52}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: theme.spacing['6xl'] },
          ]}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + Change photo */}
          <View style={[styles.avatarSection, { paddingVertical: theme.spacing['2xl'] }]}>
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={currentUser?.avatarUrl ?? undefined}
                displayName={currentUser?.displayName}
                size="2xl"
                accessibilityLabel="Your profile photo"
              />
              <Pressable
                onPress={handleChangePhoto}
                style={[
                  styles.changePhotoBadge,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.background,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleChangePhoto}
              hitSlop={hitSlop.sm}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Text
                variant="callout"
                color="accent"
                style={{ marginTop: theme.spacing.sm }}
              >
                Change photo
              </Text>
            </Pressable>
          </View>

          <Divider />

          {/* Form fields */}
          <View style={[styles.formSection, { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }]}>
            {/* Display Name */}
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label="Display name"
                  placeholder="Your name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  autoCapitalize="words"
                  returnKeyType="next"
                  containerStyle={{ marginBottom: theme.spacing.lg }}
                />
              )}
            />

            {/* Username */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label="Username"
                  placeholder="username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  containerStyle={{ marginBottom: theme.spacing.lg }}
                  leftElement={
                    <Text variant="callout" color="tertiary">
                      @
                    </Text>
                  }
                />
              )}
            />

            {/* Bio */}
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Input
                    ref={ref}
                    label="Bio"
                    placeholder="Tell the world about yourself…"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bio?.message}
                    multiline
                    numberOfLines={4}
                    maxLength={BIO_MAX}
                    returnKeyType="default"
                  />
                  <Text
                    variant="caption"
                    color={bioValue.length >= BIO_MAX ? 'danger' : 'tertiary'}
                    align="right"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    {bioValue.length}/{BIO_MAX}
                  </Text>
                </View>
              )}
            />

            {/* isPrivate */}
            <View
              style={[
                styles.switchRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.xl,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                },
              ]}
            >
              <View style={styles.switchLabel}>
                <Text variant="callout" color="primary">
                  Private account
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={{ marginTop: theme.spacing.xxs }}
                >
                  Only approved followers can see your posts
                </Text>
              </View>
              <Controller
                control={control}
                name="isPrivate"
                render={({ field: { value, onChange } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.accent,
                    }}
                    thumbColor={theme.colors.surface}
                    accessibilityLabel="Private account"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: value }}
                  />
                )}
              />
            </View>
          </View>

          {/* Bottom save button */}
          <View style={[{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }]}>
            <Button
              label="Save changes"
              variant="primary"
              size="md"
              fullWidth
              loading={isSubmitting}
              disabled={!isDirty || isSubmitting}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel="Save profile changes"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    // paddingBottom applied inline
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    // paddingHorizontal + paddingTop applied inline
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
});
