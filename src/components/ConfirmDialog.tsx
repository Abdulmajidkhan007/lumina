/**
 * Lumina — ConfirmDialog
 *
 * Themed replacement for the native `Alert.alert` confirm flow. A centered,
 * transparent Modal with a dimmed backdrop, a rounded elevated card, and a
 * Reanimated scale/fade entrance. Two actions: a ghost "cancel" and a
 * primary — or danger, via `destructive` — "confirm".
 *
 * Usage:
 *   <ConfirmDialog
 *     visible={visible}
 *     title="Sign out"
 *     message="Are you sure you want to sign out?"
 *     confirmLabel="Sign out"
 *     cancelLabel="Cancel"
 *     destructive
 *     onConfirm={handleConfirm}
 *     onCancel={() => setVisible(false)}
 *   />
 */

import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Renders the confirm button as the danger variant. Default false. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.9,
} as const;

const ENTER_DURATION = 200;
const EXIT_DURATION = 150;
const HIDDEN_SCALE = 0.9;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const theme = useTheme();

  const scale = useSharedValue(HIDDEN_SCALE);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: ENTER_DURATION });
    } else {
      scale.value = withTiming(HIDDEN_SCALE, { duration: EXIT_DURATION });
      opacity.value = withTiming(0, { duration: EXIT_DURATION });
    }
  }, [visible, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme.colors.overlay },
          backdropStyle,
        ]}
        pointerEvents="none"
      />

      {/* Tap-outside to dismiss */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      />

      {/* Card */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: theme.radii['2xl'],
              padding: theme.spacing.xl,
              ...theme.shadows.lg,
            },
            cardStyle,
          ]}
          accessibilityRole="alert"
        >
          <Text
            variant="headline"
            color="primary"
            align="center"
            style={{ marginBottom: theme.spacing.sm }}
          >
            {title}
          </Text>
          <Text
            variant="callout"
            color="secondary"
            align="center"
            style={{ marginBottom: theme.spacing.xl }}
          >
            {message}
          </Text>

          <View style={[styles.actions, { gap: theme.spacing.md }]}>
            <View style={styles.actionSlot}>
              <Button
                label={cancelLabel}
                variant="ghost"
                size="md"
                fullWidth
                onPress={onCancel}
                accessibilityLabel={cancelLabel}
              />
            </View>
            <View style={styles.actionSlot}>
              <Button
                label={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                size="md"
                fullWidth
                onPress={onConfirm}
                accessibilityLabel={confirmLabel}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
  },
  actionSlot: {
    flex: 1,
  },
});
