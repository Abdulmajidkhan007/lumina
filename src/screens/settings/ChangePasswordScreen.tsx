/**
 * Lumina — Change Password screen
 *
 * Current + new + confirm password form (RHF + Zod). Requires the current
 * password and re-authenticates against it before applying the new one
 * (see FirebaseAuthApi.changePassword) — closes the security gap where the
 * old flow accepted a new password with no proof of the old one.
 *
 * Success shows a themed confirmation card, then goes back. Failure (e.g.
 * wrong current password) surfaces inline via an error banner. A "Forgot
 * password?" link below the form sends a reset email for the signed-in
 * account directly, without needing the (unreachable from here) auth stack.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { z } from 'zod';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { useChangePassword } from '@/data/query/hooks/useChangePassword';
import { authApi } from '@/data/api/client';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChangePasswordScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const changePasswordMutation = useChangePassword();

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [forgotPending, setForgotPending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSubmit = useCallback(
    (data: ChangePasswordInput) => {
      changePasswordMutation.mutate(
        { currentPassword: data.currentPassword, newPassword: data.newPassword },
        { onSuccess: () => setSubmitted(true) },
      );
    },
    [changePasswordMutation],
  );

  const toggleCurrentPasswordVisible = useCallback(() => {
    setCurrentPasswordVisible((v) => !v);
  }, []);

  const toggleNewPasswordVisible = useCallback(() => {
    setNewPasswordVisible((v) => !v);
  }, []);

  const toggleConfirmPasswordVisible = useCallback(() => {
    setConfirmPasswordVisible((v) => !v);
  }, []);

  const focusNewPassword = useCallback(() => {
    newPasswordRef.current?.focus();
  }, []);

  const focusConfirm = useCallback(() => {
    confirmRef.current?.focus();
  }, []);

  const handleForgotPassword = useCallback(() => {
    setForgotError(null);
    setForgotPending(true);
    void (async () => {
      try {
        const email = await authApi.getCurrentUserEmail();
        if (!email) {
          setForgotError(t('changePassword.forgotPasswordNoEmail'));
          return;
        }
        await authApi.resetPassword(email);
        setForgotSent(true);
      } catch (error) {
        setForgotError(
          error instanceof Error ? error.message : t('changePassword.forgotPasswordError'),
        );
      } finally {
        setForgotPending(false);
      }
    })();
  }, [t]);

  const currentPasswordIcon = (
    <Pressable
      onPress={toggleCurrentPasswordVisible}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={
        currentPasswordVisible ? t('changePassword.hidePassword') : t('changePassword.showPassword')
      }
    >
      <Ionicons
        name={currentPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );

  const newPasswordIcon = (
    <Pressable
      onPress={toggleNewPasswordVisible}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={
        newPasswordVisible ? t('changePassword.hidePassword') : t('changePassword.showPassword')
      }
    >
      <Ionicons
        name={newPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );

  const confirmPasswordIcon = (
    <Pressable
      onPress={toggleConfirmPasswordVisible}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={
        confirmPasswordVisible
          ? t('changePassword.hidePassword')
          : t('changePassword.showPassword')
      }
    >
      <Ionicons
        name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('changePassword.title')}
        onBack={goBack}
        backAccessibilityLabel={t('changePassword.goBack')}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={52}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              paddingBottom: theme.spacing['6xl'],
            },
          ]}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {submitted ? (
            <View
              style={[
                styles.successCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.xl,
                  padding: theme.spacing.xl,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.successIcon,
                  {
                    backgroundColor: theme.colors.success + '22',
                    borderRadius: theme.radii.full,
                    padding: theme.spacing.lg,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.success} />
              </View>
              <Text
                variant="headline"
                color="primary"
                align="center"
                style={{ marginBottom: theme.spacing.sm }}
              >
                {t('changePassword.successTitle')}
              </Text>
              <Text
                variant="callout"
                color="secondary"
                align="center"
                style={{ marginBottom: theme.spacing.xl }}
              >
                {t('changePassword.successMessage')}
              </Text>
              <Button
                label={t('changePassword.done')}
                variant="primary"
                size="md"
                fullWidth
                onPress={goBack}
                accessibilityLabel={t('changePassword.done')}
              />
            </View>
          ) : (
            <>
              {changePasswordMutation.isError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.danger,
                      borderRadius: theme.radii.md,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                  accessibilityRole="alert"
                >
                  <Text variant="caption" color="danger" align="center">
                    {changePasswordMutation.error instanceof Error
                      ? changePasswordMutation.error.message
                      : t('changePassword.genericError')}
                  </Text>
                </View>
              ) : null}

              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <Input
                    ref={ref}
                    label={t('changePassword.currentPasswordLabel')}
                    placeholder={t('changePassword.currentPasswordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.currentPassword?.message}
                    secureTextEntry={!currentPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={focusNewPassword}
                    rightElement={currentPasswordIcon}
                    containerStyle={{ marginBottom: theme.spacing.lg }}
                  />
                )}
              />

              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={newPasswordRef}
                    label={t('changePassword.newPasswordLabel')}
                    placeholder={t('changePassword.newPasswordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.newPassword?.message}
                    secureTextEntry={!newPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={focusConfirm}
                    rightElement={newPasswordIcon}
                    containerStyle={{ marginBottom: theme.spacing.lg }}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={confirmRef}
                    label={t('changePassword.confirmPasswordLabel')}
                    placeholder={t('changePassword.confirmPasswordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    secureTextEntry={!confirmPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    rightElement={confirmPasswordIcon}
                    containerStyle={{ marginBottom: theme.spacing.xl }}
                  />
                )}
              />

              <Button
                label={t('changePassword.submit')}
                variant="primary"
                size="md"
                fullWidth
                loading={changePasswordMutation.isPending}
                onPress={handleSubmit(onSubmit)}
                accessibilityLabel={t('changePassword.submit')}
              />

              <Pressable
                onPress={handleForgotPassword}
                disabled={forgotPending || forgotSent}
                hitSlop={hitSlop.sm}
                style={{ marginTop: theme.spacing.xl, alignItems: 'center' }}
                accessibilityRole="button"
                accessibilityLabel={t('changePassword.forgotPassword')}
              >
                <Text variant="callout" color="accent">
                  {t('changePassword.forgotPassword')}
                </Text>
              </Pressable>

              {forgotSent ? (
                <Text
                  variant="caption"
                  color="secondary"
                  align="center"
                  style={{ marginTop: theme.spacing.sm }}
                >
                  {t('changePassword.forgotPasswordSent')}
                </Text>
              ) : null}

              {forgotError ? (
                <Text
                  variant="caption"
                  color="danger"
                  align="center"
                  style={{ marginTop: theme.spacing.sm }}
                >
                  {forgotError}
                </Text>
              ) : null}
            </>
          )}
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
  scrollContent: {
    // padding applied inline via theme spacing
  },
  successCard: {
    alignItems: 'center',
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    borderWidth: 1,
  },
});
