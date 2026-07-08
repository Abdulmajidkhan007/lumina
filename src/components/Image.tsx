/**
 * Lumina — Image
 *
 * Thin typed wrapper around the React Native core Image that preserves the
 * expo-image call-site API used across the codebase (`contentFit`, string
 * sources, `recyclingKey`/`transition`/`placeholder` accepted but unused),
 * so swapped imports compile without behavioral surprises.
 */

import React, { memo, useMemo } from 'react';
import {
  Image as RNImage,
  type ImageProps as RNImageProps,
  type ImageResizeMode,
  type ImageSourcePropType,
} from 'react-native';

export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none';

export interface ImageProps extends Omit<RNImageProps, 'source' | 'resizeMode'> {
  source?: string | { uri: string } | number;
  contentFit?: ImageContentFit;
  /** Accepted for expo-image call-site compatibility; no-ops on core Image. */
  recyclingKey?: string;
  /** Accepted for expo-image call-site compatibility; no-ops on core Image. */
  transition?: number;
  /** Accepted for expo-image call-site compatibility; no-ops on core Image. */
  placeholder?: unknown;
}

const contentFitToResizeMode: Record<ImageContentFit, ImageResizeMode> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'stretch',
  none: 'center',
};

function ImageBase({
  source,
  contentFit = 'cover',
  recyclingKey: _recyclingKey,
  transition: _transition,
  placeholder: _placeholder,
  ...rest
}: ImageProps): React.JSX.Element {
  const resolvedSource: ImageSourcePropType | undefined = useMemo(
    () => (typeof source === 'string' ? { uri: source } : source),
    [source],
  );

  return (
    <RNImage
      source={resolvedSource}
      resizeMode={contentFitToResizeMode[contentFit]}
      {...rest}
    />
  );
}

export const Image = memo(ImageBase);
export default Image;
