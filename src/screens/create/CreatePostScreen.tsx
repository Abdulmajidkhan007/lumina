/**
 * Lumina — Create Post modal
 *
 * Two-step flow:
 *   Step 1 "Select" — large preview + MediaPickerGrid (gallery/camera actions
 *     up top, mock tile grid below as a fallback selection source).
 *   Step 2 "Details" — SelectedMediaPreview thumbnail(s) + CaptionForm.
 *
 * Media picked from the gallery/camera and media tapped in the mock grid are
 * unified into a single `SelectedMedia[]` selection (see
 * `@/features/create` — `mockTileToSelectedMedia` / `pickedMediaToSelectedMedia`),
 * so the rest of the flow (preview, caption step, share) is identical
 * regardless of where the media came from.
 *
 * Share calls `useCreatePost` (postsApi.createPost under the hood), which
 * invalidates the feed cache on success; the screen then navigates back.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme , Text , Spinner } from '@/design-system';
import { Image } from '@/components/Image';
import { hitSlop, screen } from '@/constants/layout';
import { Config } from '@/constants/config';
import { formatDuration } from '@/utils/format';
import { useCreatePost } from '@/data/query/hooks';
import type { CreatePostInput } from '@/data/api/contracts';
import { UserMultiSelectModal } from '@/components/UserMultiSelectModal';
import { useCurrentUser } from '@/stores';
import type { UserId, UserSummary } from '@/types/models';
import {
  MediaPickerGrid,
  SelectedMediaPreview,
  CaptionForm,
  useMockGalleryTiles,
  useMediaPicker,
  createPostSchema,
  mockTileToSelectedMedia,
  pickedMediaToSelectedMedia,
} from '@/features/create';
import type { CreatePostFormValues , SelectedMedia } from '@/features/create';

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
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const tiles = useMockGalleryTiles();
  const { pickFromGallery, captureWithCamera } = useMediaPicker();

  // ---- Local state ----
  const [step, setStep] = useState<FlowStep>('select');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<UserSummary[]>([]);
  const [collaborators, setCollaborators] = useState<UserSummary[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [collabModalOpen, setCollabModalOpen] = useState(false);

  // ---- Create post mutation ----
  const createPostMutation = useCreatePost();
  const isSubmitting = createPostMutation.isPending;

  // ---- Mounted guard — the picker/camera promises can resolve after the
  // screen has been dismissed (e.g. user backs out while the native picker
  // is still closing); avoid setState on an unmounted component. ----
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
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
  const firstSelectedMedia: SelectedMedia | undefined = selectedMedia[0];

  // Ids of mock tiles currently part of the selection — drives the grid's
  // own checkbox/order-badge UI; media picked via gallery/camera has no
  // corresponding grid cell.
  const gridSelectedIds = useMemo(
    () => selectedMedia.filter((m) => m.source === 'mock').map((m) => m.id),
    [selectedMedia],
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

  // ---- Mock grid tile toggle ----
  const handleToggle = useCallback(
    (id: string) => {
      setSelectedMedia((prev) => {
        const idx = prev.findIndex((m) => m.id === id && m.source === 'mock');
        if (idx !== -1) {
          // Deselect
          return prev.filter((_, i) => i !== idx);
        }
        // Enforce max count
        if (prev.length >= Config.MAX_POST_MEDIA_COUNT) return prev;
        const tile = tiles.find((t) => t.id === id);
        if (tile === undefined) return prev;
        return [...prev, mockTileToSelectedMedia(tile)];
      });
    },
    [tiles],
  );

  // ---- Real media pickers (gallery / camera) ----
  const appendPickedMedia = useCallback((picked: SelectedMedia[]) => {
    if (picked.length === 0) return;
    setSelectedMedia((prev) => [...prev, ...picked].slice(0, Config.MAX_POST_MEDIA_COUNT));
  }, []);

  const handlePickFromGallery = useCallback(() => {
    setIsGalleryLoading(true);
    void pickFromGallery()
      .then((assets) => {
        if (!isMountedRef.current) return;
        appendPickedMedia(assets.map(pickedMediaToSelectedMedia));
      })
      .finally(() => {
        if (isMountedRef.current) setIsGalleryLoading(false);
      });
  }, [pickFromGallery, appendPickedMedia]);

  const handleCaptureWithCamera = useCallback(() => {
    setIsCameraLoading(true);
    void captureWithCamera()
      .then((assets) => {
        if (!isMountedRef.current) return;
        appendPickedMedia(assets.map(pickedMediaToSelectedMedia));
      })
      .finally(() => {
        if (isMountedRef.current) setIsCameraLoading(false);
      });
  }, [captureWithCamera, appendPickedMedia]);

  // ---- Dismiss ----
  const dismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ---- Submit ----
  const onSubmit = useCallback(
    (values: CreatePostFormValues) => {
      if (isSubmitting || selectedMedia.length === 0) return;

      const trimmedLocation = location.trim();
      const input: CreatePostInput = {
        media: selectedMedia.map((m) => ({
          uri: m.uri,
          type: m.kind,
          width: m.width,
          height: m.height,
          durationMs: m.durationMs,
        })),
        caption: values.caption,
        ...(trimmedLocation.length > 0 ? { location: trimmedLocation } : {}),
        ...(taggedUsers.length > 0
          ? { taggedUserIds: taggedUsers.map((u) => u.id as UserId) }
          : {}),
        ...(collaborators.length > 0
          ? { collaboratorIds: collaborators.map((u) => u.id as UserId) }
          : {}),
      };

      createPostMutation.mutate(input, {
        onSuccess: () => {
          if (isMountedRef.current) navigation.goBack();
        },
      });
    },
    [isSubmitting, selectedMedia, createPostMutation, navigation, location, taggedUsers, collaborators],
  );

  // ---- Accessors ----
  const canAdvance = selectedMedia.length > 0;

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
        {/* Large preview of currently focused item */}
        <View
          style={[
            styles.previewContainer,
            {
              height: PREVIEW_HEIGHT,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {firstSelectedMedia !== undefined ? (
            <>
              <Image
                source={{ uri: firstSelectedMedia.uri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                recyclingKey={`main-preview-${firstSelectedMedia.id}`}
                transition={180}
                accessibilityLabel={
                  firstSelectedMedia.kind === 'video'
                    ? 'Selected video preview'
                    : 'Selected photo preview'
                }
                accessibilityRole="image"
              />
              {firstSelectedMedia.kind === 'video' ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.videoPreviewOverlay,
                    { backgroundColor: theme.colors.overlay },
                  ]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  <Ionicons name="play-circle" size={64} color="white" />
                  {firstSelectedMedia.durationMs !== undefined ? (
                    <Text
                      variant="callout"
                      color="inverse"
                      style={{ marginTop: theme.spacing.xs, fontWeight: '700' }}
                    >
                      {formatDuration(firstSelectedMedia.durationMs)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </>
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
                Choose media from the gallery, camera, or the tiles below
              </Text>
            </View>
          )}

          {/* Multi-select badge count */}
          {selectedMedia.length > 1 ? (
            <View
              style={[
                styles.multiCountBadge,
                { backgroundColor: theme.colors.accent },
              ]}
              accessibilityLabel={`${selectedMedia.length} items selected`}
            >
              <Text variant="overline" color="inverse" style={{ fontWeight: '700' }}>
                {selectedMedia.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Fallback mock grid — real selection happens via the gallery/camera
            actions rendered as this list's header (see MediaPickerGrid). */}
        <MediaPickerGrid
          tiles={tiles}
          selectedIds={gridSelectedIds}
          onToggle={handleToggle}
          onPickFromGallery={handlePickFromGallery}
          onCaptureWithCamera={handleCaptureWithCamera}
          isGalleryLoading={isGalleryLoading}
          isCameraLoading={isCameraLoading}
          isAtLimit={selectedMedia.length >= Config.MAX_POST_MEDIA_COUNT}
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
        <SelectedMediaPreview media={selectedMedia} />
        <CaptionForm
          control={control}
          errors={errors}
          avatarUri={currentUser?.avatarUrl ?? undefined}
          displayName={currentUser?.displayName ?? undefined}
        />

        {/* Location */}
        <View style={[styles.metaRow, { borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}>
          <Ionicons name="location-outline" size={22} color={theme.colors.textSecondary} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Add location"
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.metaInput, { color: theme.colors.textPrimary }]}
            returnKeyType="done"
          />
        </View>

        {/* Tag people */}
        <Pressable
          style={[styles.metaRow, { borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}
          onPress={() => setTagModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Tag people"
        >
          <Ionicons name="person-outline" size={22} color={theme.colors.textSecondary} />
          <Text variant="callout" color={taggedUsers.length > 0 ? 'primary' : 'tertiary'} style={styles.metaLabel}>
            {taggedUsers.length > 0 ? `Tagged: ${taggedUsers.map((u) => u.username).join(', ')}` : 'Tag people'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        {/* Invite collaborator */}
        <Pressable
          style={[styles.metaRow, { borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}
          onPress={() => setCollabModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Invite collaborator"
        >
          <Ionicons name="people-outline" size={22} color={theme.colors.textSecondary} />
          <Text variant="callout" color={collaborators.length > 0 ? 'primary' : 'tertiary'} style={styles.metaLabel}>
            {collaborators.length > 0
              ? `Collab: ${collaborators.map((u) => u.username).join(', ')}`
              : 'Invite collaborator'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        <UserMultiSelectModal
          visible={tagModalOpen}
          title="Tag people"
          initialSelected={taggedUsers}
          onClose={() => setTagModalOpen(false)}
          onDone={setTaggedUsers}
        />
        <UserMultiSelectModal
          visible={collabModalOpen}
          title="Invite collaborators"
          initialSelected={collaborators}
          onClose={() => setCollabModalOpen(false)}
          onDone={setCollaborators}
        />
        {createPostMutation.isError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.danger,
                borderRadius: theme.radii.md,
                marginHorizontal: theme.spacing.lg,
                padding: theme.spacing.md,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text variant="caption" color="danger" align="center">
              {createPostMutation.error instanceof Error
                ? createPostMutation.error.message
                : 'Something went wrong while sharing this post.'}
            </Text>
          </View>
        ) : null}
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
  videoPreviewOverlay: {
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
  errorBanner: {
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  metaLabel: {
    flex: 1,
  },
});
