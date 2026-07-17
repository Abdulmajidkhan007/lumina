/**
 * Lumina — Login screen
 *
 * Premium centered layout: Lumina wordmark with gradient, RHF + zodResolver,
 * email/phone + password fields with show/hide, gradient submit button,
 * friendly error display, KeyboardAvoidingView, and safe-area insets.
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
import Animated, { FadeInDown } from 'react-native-reanimated';

import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/forms';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Staggered entrance timings — wordmark -> fields -> button
// ---------------------------------------------------------------------------

const ENTER_WORDMARK = FadeInDown.duration(300).delay(0);
const ENTER_FIELDS = FadeInDown.duration(300).delay(100);
const ENTER_BUTTON = FadeInDown.duration(300).delay(200);
const ENTER_FOOTER = FadeInDown.duration(300).delay(260);

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const loginMutation = useLogin();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = useCallback(
    (data: LoginInput) => {
      loginMutation.mutate(data);
    },
    [loginMutation],
  );

  const togglePasswordVisible = useCallback(() => {
    setPasswordVisible((v) => !v);
  }, []);

  const goToSignup = useCallback(() => {
    navigation.navigate('Signup');
  }, [navigation]);

  const goToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  const passwordIcon = (
    <Pressable
      onPress={togglePasswordVisible}
      hitSlop={hitSlop.sm}
      accessibilityLabel={
        passwordVisible ? t('auth.login.hidePassword') : t('auth.login.showPassword')
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
          <Animated.View
            entering={reducedMotion ? undefined : ENTER_WORDMARK}
            style={styles.logoContainer}
          >
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
              {t('auth.login.title')}
            </Text>
            <Text
              variant="callout"
              color="secondary"
              align="center"
              style={{ marginTop: theme.spacing.xs }}
            >
              {t('auth.login.subtitle')}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={reducedMotion ? undefined : ENTER_FIELDS}
            style={[styles.form, { gap: theme.spacing.lg }]}
          >
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('auth.login.identifierLabel')}
                  placeholder={t('auth.login.identifierPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.identifier?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  textContentType="emailAddress"
                  accessibilityLabel={t('auth.login.identifierLabel')}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label={t('auth.login.passwordLabel')}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  textContentType="password"
                  rightElement={passwordIcon}
                  accessibilityLabel={t('auth.login.passwordLabel')}
                />
              )}
            />

            {/* Forgot password */}
            <Pressable
              onPress={goToForgotPassword}
              style={styles.forgotRow}
              accessibilityRole="button"
              accessibilityLabel={t('auth.login.forgotPassword')}
            >
              <Text variant="callout" color="accent">
                {t('auth.login.forgotPassword')}
              </Text>
            </Pressable>

            {/* Mutation error */}
            {loginMutation.isError ? (
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
                  {loginMutation.error instanceof Error
                    ? loginMutation.error.message
                    : t('auth.login.genericError')}
                </Text>
              </View>
            ) : null}

            <Animated.View entering={reducedMotion ? undefined : ENTER_BUTTON}>
              <Button
                label={t('auth.login.submit')}
                variant="primary"
                size="lg"
                fullWidth
                loading={loginMutation.isPending}
                onPress={handleSubmit(onSubmit)}
                accessibilityLabel={t('auth.login.submitAccessibilityLabel')}
              />
            </Animated.View>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={reducedMotion ? undefined : ENTER_FOOTER}
            style={[styles.footer, { marginTop: theme.spacing['3xl'] }]}
          >
            <Text variant="callout" color="secondary">
              {t('auth.login.noAccount')}{' '}
            </Text>
            <Pressable
              onPress={goToSignup}
              accessibilityRole="button"
              accessibilityLabel={t('auth.login.signUpAccessibilityLabel')}
            >
              <Text variant="callout" color="accent">
                {t('auth.login.signUp')}
              </Text>
            </Pressable>
          </Animated.View>
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
  forgotRow: {
    alignSelf: 'flex-end',
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
