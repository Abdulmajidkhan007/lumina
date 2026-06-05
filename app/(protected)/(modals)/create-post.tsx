/**
 * Lumina — Create Post modal
 *
 * Two-step flow:
 *   Step 1 "Select" — large preview + MediaPickerGrid.
 *   Step 2 "Details" — SelectedMediaPreview thumbnail(s) + CaptionForm.
 *
 * Share triggers a mock POST (setTimeout ~800ms) then invalidates the feed
 * cache and navigates back.
 *
 * // TODO expo-image-picker: wire real picker when expo-image-picker is added.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme , Text , Spinner } from '@/design-system';
import { Image } from 'expo-image';
import { hitSlop, screen } from '@/constants/layout';
import { queryClient } from '@/lib';
import { queryKeys } from '@/data/query/keys';
import { useCurrentUser } from '@/stores';
import {
  MediaPickerGrid,
  SelectedMediaPreview,
  CaptionForm,
  useMockGalleryTiles,
  createPostSchema,
} from '@/features/create';
import type { CreatePostFormValues , MockMediaTile } from '@/features/create';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FlowStep = 'select' | 'details';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREVIEW_HEIGHT = screen.width * 0.7;
const HEADER_HEIGHT = 52;
const ANIM_DURATION = 220;

// ---------------------------------------------------------------------------
// CreatePostModal
// ---------------------------------------------------------------------------

export default function CreatePostModal(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const tiles = useMockGalleryTiles();

  // ---- Local state ----
  const [step, setStep] = useState<FlowStep>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Cleanup ref for the mock submit timer ----
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current !== null) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // ---- RHF ----
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { caption: '' },
  });

  // ---- Derived ----
  const firstSelectedTile: MockMediaTile | undefined = tiles.find(
    (t) => t.id === selectedIds[0],
  );

  // ---- Slide animation for step transition ----
  const slideX = useSharedValue(0);

  const goToDetails = useCallback(() => {
    slideX.value = 0;
    setStep('details');
    slideX.value = withTiming(0, { duration: ANIM_DURATION, easing: Easing.out(Easing.quad) });
  }, [slideX]);

  const goToSelect = useCallback(() => {
    setStep('select');
  }, []);

  // ---- Tile toggle ----
  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx !== -1) {
        // Deselect
        return prev.filter((x) => x !== id);
      }
      // Enforce max count
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  }, []);

  // ---- Dismiss ----
  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  // ---- Submit ----
  const onSubmit = useCallback(
    (_values: CreatePostFormValues) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Mock create — TODO: wire to real postsApi.createPost when available
      submitTimerRef.current = setTimeout(() => {
        setIsSubmitting(false);
        // Invalidate feed so new post appears on navigate back
        void queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
        router.back();
      }, 800);
    },
    [isSubmitting, router],
  );

  // ---- Accessors ----
  const canAdvance = selectedIds.length > 0;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderHeader(): React.JSX.Element {
    return (
      <View
        style={[
          styles.header,
          {
            height: HEADER_HEIGHT,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        {/* Left action */}
        {step === 'select' ? (
          <Pressable
            onPress={dismiss}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={styles.headerSideBtn}
          >
            <Text variant="callout" color="primary">
              Cancel
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goToSelect}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Back to media selection"
            style={styles.headerSideBtn}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        )}

        {/* Title */}
        <Text variant="bodyStrong" color="primary" align="center">
          New Post
        </Text>

        {/* Right action */}
        {step === 'select' ? (
          <Pressable
            onPress={canAdvance ? goToDetails : undefined}
            hitSlop={hitSlop.md}
            disabled={!canAdvance}
            accessibilityRole="button"
            accessibilityLabel="Next step"
            accessibilityState={{ disabled: !canAdvance }}
            style={[styles.headerSideBtn, styles.headerSideBtnRight]}
          >
            <Text
              variant="callout"
              color={canAdvance ? 'accent' : 'tertiary'}
              style={{ fontWeight: '600' }}
            >
              Next
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={isSubmitting ? undefined : handleSubmit(onSubmit)}
            hitSlop={hitSlop.md}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            style={[styles.headerSideBtn, styles.headerSideBtnRight]}
          >
            {isSubmitting ? (
              <Spinner size="sm" colorVariant="accent" />
            ) : (
              <Text
                variant="callout"
                color="accent"
                style={{ fontWeight: '700' }}
              >
                Share
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Select
  // ---------------------------------------------------------------------------

  function renderSelectStep(): React.JSX.Element {
    return (
      <>
        {/* Large preview of currently focused tile */}
        <View
          style={[
            styles.previewContainer,
            {
              height: PREVIEW_HEIGHT,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {firstSelectedTile !== undefined ? (
            <Image
              source={{ uri: firstSelectedTile.uri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              recyclingKey={`main-preview-${firstSelectedTile.id}`}
              transition={180}
              accessibilityLabel="Selected photo preview"
              accessibilityRole="image"
            />
          ) : (
            <View style={styles.previewPlaceholder} accessibilityElementsHidden>
              <Ionicons
                name="image-outline"
                size={48}
                color={theme.colors.textTertiary}
              />
              <Text
                variant="callout"
                color="tertiary"
                align="center"
                style={{ marginTop: theme.spacing.sm }}
              >
                Tap a photo to select it
              </Text>
            </View>
          )}

          {/* Multi-select badge count */}
          {selectedIds.length > 1 ? (
            <View
              style={[
                styles.multiCountBadge,
                { backgroundColor: theme.colors.accent },
              ]}
              accessibilityLabel={`${selectedIds.length} photos selected`}
            >
              <Text variant="overline" color="inverse" style={{ fontWeight: '700' }}>
                {selectedIds.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Grid */}
        <MediaPickerGrid
          tiles={tiles}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 2 — Details
  // ---------------------------------------------------------------------------

  function renderDetailsStep(): React.JSX.Element {
    return (
      <>
        <SelectedMediaPreview tiles={tiles} selectedIds={selectedIds} />
        <CaptionForm
          control={control}
          errors={errors}
          avatarUri={currentUser?.avatarUrl ?? undefined}
          displayName={currentUser?.displayName ?? undefined}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {renderHeader()}

      <View style={styles.body}>
        {step === 'select' ? renderSelectStep() : renderDetailsStep()}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles — layout only; colors flow from theme above
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSideBtn: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    minWidth: 56,
  },
  headerSideBtnRight: {
    left: undefined,
    right: 16,
    alignItems: 'flex-end',
  },
  body: {
    flex: 1,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
