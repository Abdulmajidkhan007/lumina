/**
 * Lumina — Button primitive
 *
 * Variants: primary (gradient), secondary (outlined), ghost (text), danger.
 * Pressable scale animation via Reanimated 3. Loading state shows Spinner.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../theme';
import { Text } from './Text';
import { Spinner } from './Spinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Constants (all values from spacing/radii tokens — no magic numbers)
// ---------------------------------------------------------------------------

const SIZE_HEIGHT: Record<ButtonSize, number> = {
  sm: 36,
  md: 48,
  lg: 56,
};

const SIZE_PX: Record<ButtonSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = withSpring(0.96, SPRING_CONFIG);
      onPressIn?.(e);
    },
    [scale, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, SPRING_CONFIG);
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const height = SIZE_HEIGHT[size];
  const paddingHorizontal = SIZE_PX[size];

  // Shared container style
  const baseContainer: ViewStyle = {
    height,
    paddingHorizontal,
    borderRadius: theme.radii['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
    overflow: 'hidden',
  };

  // Variant-specific styles
  const variantContainer: ViewStyle =
    variant === 'secondary'
      ? {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        }
      : variant === 'ghost'
      ? { backgroundColor: 'transparent' }
      : variant === 'danger'
      ? { backgroundColor: theme.colors.danger }
      : {}; // primary handled by LinearGradient

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? ('inverse' as const)
      : variant === 'secondary'
      ? ('primary' as const)
      : ('accent' as const);

  const textVariant = size === 'sm' ? ('callout' as const) : ('bodyStrong' as const);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[animatedStyle, style]}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[...theme.colors.accentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[baseContainer, variantContainer, styles.gradientFill]}
        >
          {loading ? (
            <Spinner size="sm" colorVariant="inverse" />
          ) : (
            <Text variant={textVariant} color={textColor}>
              {label}
            </Text>
          )}
        </LinearGradient>
      ) : (
        <Animated.View style={[baseContainer, variantContainer]}>
          {loading ? (
            <Spinner size="sm" colorVariant={variant === 'ghost' ? 'accent' : 'primary'} />
          ) : (
            <Text variant={textVariant} color={textColor}>
              {label}
            </Text>
          )}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradientFill: {
    // LinearGradient needs explicit fill to cover the pressable bounds
    position: 'relative',
    width: '100%',
  },
});
