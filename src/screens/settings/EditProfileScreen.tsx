/**
 * Lumina — Edit Profile screen
 *
 * React Hook Form + zodResolver(editProfileSchema).
 * Fields: displayName, username, bio (multiline + char count), isPrivate switch.
 * Avatar with "Change photo" affordance backed by useMediaPicker (single image).
 * Save persists the form fields + optional picked avatar via useUpdateProfile.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';

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
import { useUpdateProfile } from '@/data/query/hooks';
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
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | undefined>(undefined);

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
      website: currentUser?.website ?? '',
      birthday: currentUser?.birthday ?? '',
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
        website: currentUser.website ?? '',
        birthday: currentUser.birthday ?? '',
        isPrivate: currentUser.isPrivate,
      });
    }
  }, [currentUser, reset]);

  const bioValue = watch('bio') ?? '';

  // A picked avatar makes the form savable even if no text field changed.
  const canSave = isDirty || avatarLocalUri !== undefined;

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSubmit = useCallback(
    async (data: EditProfileInput) => {
      try {
        await updateProfileMutation.mutateAsync({ input: data, avatarLocalUri });
        Alert.alert(t('editProfile.savedTitle'), t('editProfile.savedMessage'));
        navigation.goBack();
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Could not save your profile. Please try again.',
        );
      }
    },
    [avatarLocalUri, navigation, t, updateProfileMutation],
  );

  const handleChangePhoto = useCallback(async () => {
    const response: ImagePickerResponse = await new Promise((resolve) => {
      launchImageLibrary(
        // Avatars render at most ~96pt, so 512px is plenty — keeps the
        // upload small instead of shipping a full-resolution photo.
        { mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 512, maxHeight: 512 },
        resolve,
      );
    });

    if (response.didCancel === true || response.errorCode !== undefined) return;

    const uri = response.assets?.[0]?.uri;
    if (uri !== undefined) setAvatarLocalUri(uri);
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
          accessibilityLabel={t('editProfile.cancel')}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text variant="bodyStrong" color="primary">
          {t('editProfile.title')}
        </Text>
        {isSubmitting ? (
          <Spinner size="sm" />
        ) : (
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!canSave || isSubmitting}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.save')}
            accessibilityState={{ disabled: !canSave || isSubmitting }}
          >
            <Text
              variant="bodyStrong"
              color={canSave ? 'accent' : 'tertiary'}
            >
              {t('editProfile.save')}
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
                uri={avatarLocalUri ?? currentUser?.avatarUrl ?? undefined}
                displayName={currentUser?.displayName}
                size="2xl"
                accessibilityLabel={t('editProfile.avatarAccessibilityLabel')}
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
                accessibilityLabel={t('editProfile.changePhoto')}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleChangePhoto}
              hitSlop={hitSlop.sm}
              accessibilityRole="button"
              accessibilityLabel={t('editProfile.changePhoto')}
            >
              <Text
                variant="callout"
                color="accent"
                style={{ marginTop: theme.spacing.sm }}
              >
                {t('editProfile.changePhoto')}
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
                  label={t('editProfile.displayNameLabel')}
                  placeholder={t('editProfile.displayNamePlaceholder')}
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
                  label={t('editProfile.usernameLabel')}
                  placeholder={t('editProfile.usernamePlaceholder')}
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
                    label={t('editProfile.bioLabel')}
                    placeholder={t('editProfile.bioPlaceholder')}
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

            {/* Website / link in bio */}
            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('editProfile.websiteLabel')}
                  placeholder={t('editProfile.websitePlaceholder')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.website?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  containerStyle={{ marginBottom: theme.spacing.lg }}
                />
              )}
            />

            {/* Birthday (private) */}
            <Controller
              control={control}
              name="birthday"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('editProfile.birthdayLabel')}
                  placeholder="YYYY-MM-DD"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.birthday?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  containerStyle={{ marginBottom: theme.spacing.lg }}
                />
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
                  {t('editProfile.privateLabel')}
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={{ marginTop: theme.spacing.xxs }}
                >
                  {t('editProfile.privateDescription')}
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
                    accessibilityLabel={t('editProfile.privateLabel')}
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
              label={t('editProfile.save')}
              variant="primary"
              size="md"
              fullWidth
              loading={isSubmitting}
              disabled={!canSave || isSubmitting}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={t('editProfile.save')}
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
