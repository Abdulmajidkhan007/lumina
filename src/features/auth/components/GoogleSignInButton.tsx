/**
 * Lumina — "Continue with Google" button
 *
 * Mirrors the design-system `Button` primitive's press-spring feel and
 * token usage, but needs a leading brand icon + surface (not gradient)
 * background that `Button` doesn't support — so it lives here as a small,
 * auth-feature-local building block rather than a design-system addition.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Text } from '@/design-system/primitives/Text';
import { Spinner } from '@/design-system/primitives/Spinner';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface GoogleSignInButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function GoogleSignInButton({
  label,
  loading = false,
  disabled = false,
  accessibilityLabel,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: GoogleSignInButtonProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = reducedMotion ? 0.96 : withSpring(0.96, SPRING_CONFIG);
      onPressIn?.(e);
    },
    [scale, reducedMotion, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = reducedMotion ? 1 : withSpring(1, SPRING_CONFIG);
      onPressOut?.(e);
    },
    [scale, reducedMotion, onPressOut],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        animatedStyle,
        styles.container,
        {
          height: 56,
          borderRadius: theme.radii['2xl'],
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          gap: theme.spacing.sm,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" colorVariant="primary" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color={theme.colors.textPrimary} />
          <Text variant="bodyStrong" color="primary">
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderWidth: 1.5,
  },
});
