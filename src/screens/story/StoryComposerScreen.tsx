/**
 * Lumina — Story composer screen
 *
 * Full-screen dark preview shown right after a photo is picked for
 * "Your story". Previously, tapping the ring uploaded the picked image
 * immediately with no way to preview or back out — this screen inserts a
 * confirmation step between picking and uploading.
 *
 * Route: 'StoryComposer', param `{ uri: string }` (presented as a
 * fullScreenModal — see ProtectedStack). Close (top-left) discards the pick
 * and goes back; "Share to story" uploads via `useCreateStory` and returns
 * to the tabs on success. On failure the composer stays open with an inline
 * error banner so the user can retry without re-picking the image.
 */

import React, { useCallback } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { ProtectedStackParamList } from '@/navigation';
import { useTheme, Text, Spinner } from '@/design-system';
import { useReducedMotion } from '@/design-system/hooks';
import { Image } from '@/components/Image';
import { hitSlop } from '@/constants/layout';
import { useCreateStory } from '@/data/query/hooks';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 } as const;
const SHARE_BUTTON_HEIGHT = 56;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function StoryComposerScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { uri } = useRoute<RouteProp<ProtectedStackParamList, 'StoryComposer'>>().params;

  const createStory = useCreateStory();
  const isUploading = createStory.isPending;

  // ---- Share button press animation ----
  const scale = useSharedValue(1);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = reducedMotion ? 0.96 : withSpring(0.96, SPRING_CONFIG);
  }, [scale, reducedMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = reducedMotion ? 1 : withSpring(1, SPRING_CONFIG);
  }, [scale, reducedMotion]);

  // ---- Actions ----
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(() => {
    if (isUploading) return;
    createStory.mutate(
      { uri, type: 'image' },
      {
        onSuccess: () => {
          navigation.navigate('Tabs');
        },
      },
    );
  }, [createStory, isUploading, navigation, uri]);

  const errorMessage =
    createStory.error instanceof Error ? createStory.error.message : t('story.shareError');

  return (
    <View
      style={styles.root}
      accessibilityViewIsModal
      accessibilityLabel={t('story.newStoryTitle')}
    >
      <StatusBar barStyle="light-content" />

      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
        accessibilityRole="image"
        accessibilityLabel={t('story.previewLabel')}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top bar — close */}
        <View style={[styles.topBar, { paddingHorizontal: theme.spacing.lg }]}>
          <Pressable
            onPress={isUploading ? undefined : handleClose}
            disabled={isUploading}
            hitSlop={hitSlop.md}
            style={[styles.closeButton, { backgroundColor: theme.colors.overlay }]}
            accessibilityRole="button"
            accessibilityLabel={t('story.close')}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom bar — error banner + share */}
        <View style={[styles.bottomBar, { paddingHorizontal: theme.spacing.lg }]}>
          {createStory.isError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  borderColor: theme.colors.danger,
                  borderRadius: theme.radii.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                },
              ]}
              accessibilityRole="alert"
            >
              <Text variant="caption" color="danger" align="center">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <AnimatedPressable
            onPress={isUploading ? undefined : handleShare}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isUploading}
            accessibilityRole="button"
            accessibilityLabel={t('story.shareToStory')}
            accessibilityState={{ disabled: isUploading, busy: isUploading }}
            style={animatedScaleStyle}
          >
            <LinearGradient
              colors={[...theme.colors.accentGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.shareButton,
                {
                  height: SHARE_BUTTON_HEIGHT,
                  borderRadius: theme.radii['2xl'],
                  gap: theme.spacing.sm,
                  opacity: isUploading ? 0.7 : 1,
                },
              ]}
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" colorVariant="inverse" />
                  <Text variant="bodyStrong" color="inverse">
                    {t('story.uploading')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text variant="bodyStrong" color="inverse">
                    {t('story.shareToStory')}
                  </Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — layout only; colors flow from theme above (the canvas is
// intentionally always black, matching the existing story viewer convention)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingBottom: 12,
  },
  errorBanner: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
