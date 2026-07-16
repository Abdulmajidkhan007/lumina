/**
 * Lumina — Signup screen
 *
 * RHF + signupSchema: email, username, displayName, password, confirmPassword.
 * useSignup mutation, accessible, token-only styling.
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
import type { AuthStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { signupSchema } from '@/schemas/auth.schema';
import type { SignupInput } from '@/types/forms';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { hitSlop } from '@/constants/layout';

export default function SignupScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const signupMutation = useSignup();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const displayNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = useCallback(
    (data: SignupInput) => {
      signupMutation.mutate(data);
    },
    [signupMutation],
  );

  const togglePassword = useCallback(() => setPasswordVisible((v) => !v), []);
  const toggleConfirm = useCallback(() => setConfirmVisible((v) => !v), []);
  const goToLogin = useCallback(() => navigation.navigate('Login'), [navigation]);

  const passwordIcon = (
    <Pressable
      onPress={togglePassword}
      hitSlop={hitSlop.sm}
      accessibilityLabel={
        passwordVisible ? t('auth.signup.hidePassword') : t('auth.signup.showPassword')
      }
      accessibilityRole="button"
    >
      <Ionicons
        name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );

  const confirmIcon = (
    <Pressable
      onPress={toggleConfirm}
      hitSlop={hitSlop.sm}
      accessibilityLabel={
        confirmVisible
          ? t('auth.signup.hideConfirmPassword')
          : t('auth.signup.showConfirmPassword')
      }
      accessibilityRole="button"
    >
      <Ionicons
        name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: theme.spacing['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Wordmark */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[...theme.colors.accentGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoGradient, { borderRadius: theme.radii.xl }]}
            >
              <Text variant="title" color="inverse">
                Lumina
              </Text>
            </LinearGradient>
            <Text
              variant="headline"
              color="primary"
              align="center"
              style={{ marginTop: theme.spacing.xl }}
            >
              {t('auth.signup.title')}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { gap: theme.spacing.lg }]}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('auth.signup.emailLabel')}
                  placeholder={t('auth.signup.emailPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  textContentType="emailAddress"
                  accessibilityLabel={t('auth.signup.emailLabel')}
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={usernameRef}
                  label={t('auth.signup.usernameLabel')}
                  placeholder={t('auth.signup.usernamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => displayNameRef.current?.focus()}
                  textContentType="username"
                  accessibilityLabel={t('auth.signup.usernameLabel')}
                />
              )}
            />

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={displayNameRef}
                  label={t('auth.signup.displayNameLabel')}
                  placeholder={t('auth.signup.displayNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  textContentType="name"
                  accessibilityLabel={t('auth.signup.displayNameLabel')}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label={t('auth.signup.passwordLabel')}
                  placeholder={t('auth.signup.passwordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  textContentType="newPassword"
                  rightElement={passwordIcon}
                  accessibilityLabel={t('auth.signup.passwordLabel')}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={confirmRef}
                  label={t('auth.signup.confirmPasswordLabel')}
                  placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry={!confirmVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  textContentType="newPassword"
                  rightElement={confirmIcon}
                  accessibilityLabel={t('auth.signup.confirmPasswordLabel')}
                />
              )}
            />

            {/* Mutation error */}
            {signupMutation.isError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.danger,
                    borderRadius: theme.radii.md,
                    padding: theme.spacing.md,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Text variant="caption" color="danger" align="center">
                  {signupMutation.error instanceof Error
                    ? signupMutation.error.message
                    : t('auth.signup.genericError')}
                </Text>
              </View>
            ) : null}

            <Button
              label={t('auth.signup.submit')}
              variant="primary"
              size="lg"
              fullWidth
              loading={signupMutation.isPending}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={t('auth.signup.submitAccessibilityLabel')}
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { marginTop: theme.spacing['3xl'] }]}>
            <Text variant="callout" color="secondary">
              {t('auth.signup.haveAccount')}{' '}
            </Text>
            <Pressable
              onPress={goToLogin}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signup.signInAccessibilityLabel')}
            >
              <Text variant="callout" color="accent">
                {t('auth.signup.signIn')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
