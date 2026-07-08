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

import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/forms';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { hitSlop } from '@/constants/layout';

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
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
      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
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
              Welcome back
            </Text>
            <Text
              variant="callout"
              color="secondary"
              align="center"
              style={{ marginTop: theme.spacing.xs }}
            >
              Sign in to continue
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { gap: theme.spacing.lg }]}>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  ref={ref}
                  label="Email or phone"
                  placeholder="you@example.com"
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
                  accessibilityLabel="Email or phone"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label="Password"
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  textContentType="password"
                  rightElement={passwordIcon}
                  accessibilityLabel="Password"
                />
              )}
            />

            {/* Forgot password */}
            <Pressable
              onPress={goToForgotPassword}
              style={styles.forgotRow}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text variant="callout" color="accent">
                Forgot password?
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
                    : 'Sign in failed. Please try again.'}
                </Text>
              </View>
            ) : null}

            <Button
              label="Sign in"
              variant="primary"
              size="lg"
              fullWidth
              loading={loginMutation.isPending}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel="Sign in to Lumina"
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { marginTop: theme.spacing['3xl'] }]}>
            <Text variant="callout" color="secondary">
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable
              onPress={goToSignup}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text variant="callout" color="accent">
                Sign up
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
