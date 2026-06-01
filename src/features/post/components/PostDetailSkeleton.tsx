/**
 * Lumina — PostDetailSkeleton
 *
 * Loading placeholder shown while the single-post query resolves.
 */

import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/design-system/theme';
import {
  Skeleton,
  SkeletonCircle,
  SkeletonLine,
} from '@/design-system/primitives/Skeleton';
import { screen } from '@/constants/layout';

export function PostDetailSkeleton(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Author row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}
      >
        <SkeletonCircle size={40} />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <SkeletonLine widthFraction={0.4} />
          <SkeletonLine widthFraction={0.25} />
        </View>
        <SkeletonCircle size={24} />
      </View>

      {/* Media block */}
      <Skeleton
        width={screen.width}
        height={screen.width}
        radius={0}
      />

      {/* Action row */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          gap: theme.spacing.lg,
        }}
      >
        <SkeletonCircle size={26} />
        <SkeletonCircle size={26} />
        <SkeletonCircle size={26} />
      </View>

      {/* Like count */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm }}>
        <SkeletonLine widthFraction={0.25} />
      </View>

      {/* Caption */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm, gap: theme.spacing.xs }}>
        <SkeletonLine widthFraction={0.85} />
        <SkeletonLine widthFraction={0.65} />
      </View>

      {/* Comment preview rows */}
      {[0.7, 0.55].map((fraction, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.md,
            gap: theme.spacing.sm,
            alignItems: 'flex-start',
          }}
        >
          <SkeletonCircle size={32} />
          <SkeletonLine widthFraction={fraction} style={{ flex: 1, marginTop: theme.spacing.xs }} />
        </View>
      ))}
    </View>
  );
}
