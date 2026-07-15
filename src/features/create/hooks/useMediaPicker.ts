/**
 * Lumina — useMediaPicker
 *
 * Thin typed wrapper around react-native-image-picker's launchImageLibrary
 * and launchCamera. Both are promisified so call sites can `await` a
 * selection instead of threading callbacks.
 *
 * Cancellation and picker-level errors (permission denial, camera
 * unavailable, etc.) both resolve to an empty array rather than rejecting —
 * callers never need a try/catch just to handle "user backed out".
 *
 * No native permission wiring is required here: on modern Android/iOS the
 * gallery picker uses the OS-level Photo Picker, which needs no runtime
 * permission grant. Camera capture still triggers the OS camera permission
 * prompt natively; a denial simply surfaces as errorCode 'permission' below.
 */

import { useCallback, useMemo } from 'react';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { Config } from '@/constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MediaKind = 'image' | 'video';

export interface PickedMedia {
  uri: string;
  type: MediaKind;
  width?: number;
  height?: number;
  /** Video duration in milliseconds; undefined for images. */
  durationMs?: number;
  fileName?: string;
}

export interface UseMediaPickerResult {
  /** Opens the OS photo/video library picker. Resolves to [] on cancel or error. */
  pickFromGallery: () => Promise<PickedMedia[]>;
  /** Opens the device camera for a single photo/video capture. Resolves to [] on cancel or error. */
  captureWithCamera: () => Promise<PickedMedia[]>;
}

// ---------------------------------------------------------------------------
// Shared picker options
// ---------------------------------------------------------------------------

const GALLERY_OPTIONS: ImageLibraryOptions = {
  mediaType: 'mixed',
  selectionLimit: Config.MAX_POST_MEDIA_COUNT,
  quality: 0.9,
  videoQuality: 'high',
};

const CAMERA_OPTIONS: CameraOptions = {
  mediaType: 'mixed',
  quality: 0.9,
  videoQuality: 'high',
  saveToPhotos: true,
};

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mimeToMediaKind(mime: string | undefined): MediaKind {
  return mime !== undefined && mime.startsWith('video') ? 'video' : 'image';
}

function assetToPickedMedia(asset: Asset): PickedMedia | null {
  // An asset without a uri is unusable — drop it rather than crash the flow.
  if (asset.uri === undefined) return null;

  return {
    uri: asset.uri,
    type: mimeToMediaKind(asset.type),
    width: asset.width,
    height: asset.height,
    // react-native-image-picker reports `duration` in seconds.
    durationMs: asset.duration !== undefined ? Math.round(asset.duration * 1000) : undefined,
    fileName: asset.fileName,
  };
}

function responseToPickedMedia(response: ImagePickerResponse): PickedMedia[] {
  if (response.didCancel === true || response.errorCode !== undefined) {
    return [];
  }

  const assets = response.assets ?? [];
  const result: PickedMedia[] = [];
  for (const asset of assets) {
    const picked = assetToPickedMedia(asset);
    if (picked !== null) result.push(picked);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediaPicker(): UseMediaPickerResult {
  const pickFromGallery = useCallback((): Promise<PickedMedia[]> => {
    return new Promise((resolve) => {
      launchImageLibrary(GALLERY_OPTIONS, (response) => {
        resolve(responseToPickedMedia(response));
      });
    });
  }, []);

  const captureWithCamera = useCallback((): Promise<PickedMedia[]> => {
    return new Promise((resolve) => {
      launchCamera(CAMERA_OPTIONS, (response) => {
        resolve(responseToPickedMedia(response));
      });
    });
  }, []);

  return useMemo(
    () => ({ pickFromGallery, captureWithCamera }),
    [pickFromGallery, captureWithCamera],
  );
}
