/**
 * Lumina — Sheet primitive
 *
 * A gesture-dismissible bottom sheet built on react-native-gesture-handler +
 * Reanimated 3. Renders children in a themed elevated surface with a handle,
 * a scrim overlay, and spring-animated slide-in/out.
 *
 * Usage:
 *   <Sheet visible={open} onDismiss={() => setOpen(false)}>
 *     <Text>Content</Text>
 *   </Sheet>
 */

import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, type PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** Content to render inside the sheet */
  children: React.ReactNode;
  /** Maximum height as a fraction of the screen (0–1). Default 0.6 */
  maxHeightFraction?: number;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const SNAP_THRESHOLD = 80; // px — drag this far down to dismiss
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sheet({
  visible,
  onDismiss,
  children,
  maxHeightFraction = 0.6,
  style,
}: SheetProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(600);
  const overlayOpacity = useSharedValue(0);

  const open = useCallback(() => {
    translateY.value = withSpring(0, SPRING_CONFIG);
    overlayOpacity.value = withTiming(1, { duration: 250 });
  }, [translateY, overlayOpacity]);

  const close = useCallback(
    (onDone?: () => void) => {
      translateY.value = withSpring(600, SPRING_CONFIG, () => {
        if (onDone) runOnJS(onDone)();
      });
      overlayOpacity.value = withTiming(0, { duration: 200 });
    },
    [translateY, overlayOpacity],
  );

  useEffect(() => {
    if (visible) {
      open();
    } else {
      close();
    }
  }, [visible, open, close]);

  const handleDismiss = useCallback(() => {
    close(onDismiss);
  }, [close, onDismiss]);

  // Pan gesture to drag-dismiss
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event: PanGestureHandlerEventPayload) => {
      const next = startY.value + event.translationY;
      translateY.value = next > 0 ? next : 0;
    })
    .onEnd((event: PanGestureHandlerEventPayload) => {
      if (event.translationY > SNAP_THRESHOLD || event.velocityY > 800) {
        runOnJS(handleDismiss)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Scrim */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme.colors.overlay },
          overlayStyle,
        ]}
        pointerEvents="none"
      />

      {/* Tap-outside to dismiss */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />

      {/* Sheet panel */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderTopLeftRadius: theme.radii['2xl'],
              borderTopRightRadius: theme.radii['2xl'],
              paddingBottom: insets.bottom + theme.spacing.lg,
              maxHeight: `${maxHeightFraction * 100}%` as `${number}%`,
              ...theme.shadows.lg,
            },
            sheetStyle,
            style,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
