/**
 * Lumina — MediaSourceButtons
 *
 * Two prominent side-by-side actions shown above the fallback mock grid:
 * "Choose from gallery" (launchImageLibrary) and "Camera" (launchCamera).
 * Each shows a spinner in place of its icon while its own picker call is
 * in flight, and both are disabled while either is busy to avoid stacking
 * two native pickers at once.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme, Text, Spinner } from '@/design-system';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaSourceButtonsProps {
  onPickFromGallery: () => void;
  onCaptureWithCamera: () => void;
  isGalleryLoading: boolean;
  isCameraLoading: boolean;
}

interface SourceButtonProps {
  icon: string;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// SourceButton — memoized bordered action card
// ---------------------------------------------------------------------------

const SourceButton = React.memo(function SourceButton({
  icon,
  label,
  loading,
  disabled,
  onPress,
}: SourceButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
          borderRadius: theme.radii.lg,
          paddingVertical: theme.spacing.sm,
          opacity: isDisabled && !loading ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <Spinner size="sm" colorVariant="accent" />
      ) : (
        <Ionicons name={icon} size={22} color={theme.colors.accent} />
      )}
      <Text
        variant="callout"
        color="primary"
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// MediaSourceButtons
// ---------------------------------------------------------------------------

export const MediaSourceButtons = React.memo(function MediaSourceButtons({
  onPickFromGallery,
  onCaptureWithCamera,
  isGalleryLoading,
  isCameraLoading,
}: MediaSourceButtonsProps): React.JSX.Element {
  const theme = useTheme();
  const isAnyLoading = isGalleryLoading || isCameraLoading;

  // Stable handlers — parent callbacks are already useCallback-wrapped, but
  // wrapping again here keeps this component's identity independent of
  // whichever inline closures a future parent might pass.
  const handleGalleryPress = useCallback(() => {
    onPickFromGallery();
  }, [onPickFromGallery]);

  const handleCameraPress = useCallback(() => {
    onCaptureWithCamera();
  }, [onCaptureWithCamera]);

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <SourceButton
        icon="images-outline"
        label="Choose from gallery"
        loading={isGalleryLoading}
        disabled={isAnyLoading}
        onPress={handleGalleryPress}
      />
      <SourceButton
        icon="camera-outline"
        label="Camera"
        loading={isCameraLoading}
        disabled={isAnyLoading}
        onPress={handleCameraPress}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    marginLeft: 8,
    flexShrink: 1,
  },
});
