/**
 * Lumina — Forgot Password screen
 *
 * Email field + submit. Shows a success confirmation state after submitting.
 * Mock implementation (no real API call needed at this stage).
 */

import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Input } from '@/design-system/primitives/Input';
import { Button } from '@/design-system/primitives/Button';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Local schema — just the email field
// ---------------------------------------------------------------------------

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ForgotPasswordScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = useCallback(async (_data: ForgotPasswordInput) => {
    setIsLoading(true);
    // Mock delay — replace with real API call
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setSubmitted(true);
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Back button */}
      <Pressable
        onPress={goBack}
        style={[styles.backButton, { padding: theme.spacing.lg }]}
        hitSlop={hitSlop.md}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: theme.spacing['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitted ? (
            // ---- Success state ----
            <View style={styles.successContainer}>
              <View
                style={[
                  styles.successIcon,
                  {
                    backgroundColor: theme.colors.success + '22',
                    borderRadius: theme.radii.full,
                    padding: theme.spacing['2xl'],
                    marginBottom: theme.spacing.xl,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={56}
                  color={theme.colors.success}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
              <Text
                variant="headline"
                color="primary"
                align="center"
                style={{ marginBottom: theme.spacing.sm }}
              >
                Check your email
              </Text>
              <Text
                variant="callout"
                color="secondary"
                align="center"
                style={{ marginBottom: theme.spacing['3xl'], maxWidth: 280 }}
              >
                We sent a reset link to{' '}
                <Text variant="callout" color="primary">
                  {getValues('email')}
                </Text>
                . Follow the instructions to reset your password.
              </Text>
              <Button
                label="Back to sign in"
                variant="secondary"
                size="md"
                onPress={goBack}
                accessibilityLabel="Return to sign in screen"
              />
            </View>
          ) : (
            // ---- Form state ----
            <View style={styles.formContainer}>
              <Text
                variant="title"
                color="primary"
                style={{ marginBottom: theme.spacing.sm }}
              >
                Forgot password?
              </Text>
              <Text
                variant="callout"
                color="secondary"
                style={{ marginBottom: theme.spacing['3xl'], maxWidth: 300 }}
              >
                Enter your email address and we&apos;ll send you instructions
                to reset your password.
              </Text>

              <View style={{ gap: theme.spacing.xl }}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <Input
                      ref={ref}
                      label="Email"
                      placeholder="you@example.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                      textContentType="emailAddress"
                      accessibilityLabel="Email address"
                    />
                  )}
                />

                <Button
                  label="Send reset link"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onPress={handleSubmit(onSubmit)}
                  accessibilityLabel="Send password reset link"
                />
              </View>
            </View>
          )}
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
  backButton: {
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  formContainer: {
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
