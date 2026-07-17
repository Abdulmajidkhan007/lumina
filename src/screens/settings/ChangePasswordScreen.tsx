/**
 * Lumina — Change Password screen
 *
 * New password + confirm password form (RHF + Zod). Changing a Firebase
 * password from inside the app requires a re-authentication flow that
 * isn't wired up yet, so a validated submit shows a themed "coming soon"
 * acknowledgement instead of silently doing nothing — real-looking, not
 * broken. Users can still reset their password via "Forgot password" on
 * the sign-in screen.
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
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
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

  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSubmit = useCallback(async () => {
    // Simulate a real network round-trip so the flow feels intentional —
    // there's no password-change data hook yet (needs Firebase re-auth).
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
  }, []);

  const toggleNewPasswordVisible = useCallback(() => {
    setNewPasswordVisible((v) => !v);
  }, []);

  const toggleConfirmPasswordVisible = useCallback(() => {
    setConfirmPasswordVisible((v) => !v);
  }, []);

  const focusConfirm = useCallback(() => {
    confirmRef.current?.focus();
  }, []);

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
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.radii.full,
                    padding: theme.spacing.lg,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                <Ionicons name="time-outline" size={32} color={theme.colors.accent} />
              </View>
              <Text
                variant="headline"
                color="primary"
                align="center"
                style={{ marginBottom: theme.spacing.sm }}
              >
                {t('changePassword.comingSoonTitle')}
              </Text>
              <Text
                variant="callout"
                color="secondary"
                align="center"
                style={{ marginBottom: theme.spacing.xl }}
              >
                {t('changePassword.comingSoonMessage')}
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
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <Input
                    ref={ref}
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
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
                accessibilityLabel={t('changePassword.submit')}
              />
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
});
