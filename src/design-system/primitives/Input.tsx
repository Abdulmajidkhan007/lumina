/**
 * Lumina — Input primitive
 *
 * Theme-aware text input with label, error text, focus ring.
 * forwardRef compatible; designed for React Hook Form Controller.
 */

import React, { forwardRef, useCallback, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme';
import { Text } from './Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional left icon — pass a pre-built React element */
  leftElement?: React.ReactNode;
  /** Optional right icon — pass a pre-built React element */
  rightElement?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Input = forwardRef<TextInput, InputProps>(function Input(
  props: InputProps,
  ref: React.Ref<TextInput>,
) {
  const {
    label,
    error,
    hint,
    containerStyle,
    leftElement,
    rightElement,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  } = props;
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderOpacity = useSharedValue(0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      borderOpacity.value = withTiming(1, { duration: 180 });
      onFocus?.(e);
    },
    [borderOpacity, onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      borderOpacity.value = withTiming(0, { duration: 180 });
      onBlur?.(e);
    },
    [borderOpacity, onBlur],
  );

  const focusRingStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const hasError = Boolean(error);
  const isDisabled = editable === false;

  // Resolved colors — no raw hex
  const borderColor = hasError
    ? theme.colors.danger
    : isFocused
    ? theme.colors.accent
    : theme.colors.border;

  const inputBg = isDisabled ? theme.colors.surface : theme.colors.surfaceElevated;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label !== undefined && label !== '' ? (
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: inputBg,
            borderColor,
            borderRadius: theme.radii.lg,
            height: 48,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Focus ring overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.focusRing,
            { borderRadius: theme.radii.lg, borderColor: theme.colors.accent },
            focusRingStyle,
          ]}
          pointerEvents="none"
        />

        {leftElement !== undefined ? (
          <View style={styles.adornment}>{leftElement}</View>
        ) : null}

        <TextInput
          ref={ref}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
              paddingLeft: leftElement !== undefined ? theme.spacing.xs : theme.spacing.lg,
              paddingRight: rightElement !== undefined ? theme.spacing.xs : theme.spacing.lg,
            },
          ]}
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled }}
          {...rest}
        />

        {rightElement !== undefined ? (
          <View style={styles.adornment}>{rightElement}</View>
        ) : null}
      </View>

      {hasError ? (
        <Text variant="caption" color="danger" style={styles.helperText}>
          {error}
        </Text>
      ) : hint !== undefined && hint !== '' ? (
        <Text variant="caption" color="tertiary" style={styles.helperText}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles — layout only; colors come from theme above
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  focusRing: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    // height fills the container
    alignSelf: 'stretch',
  },
  adornment: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    marginTop: 2,
  },
});
