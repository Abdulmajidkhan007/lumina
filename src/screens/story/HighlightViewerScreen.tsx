/**
 * Lumina — Highlight viewer
 *
 * Full-screen, tap-to-advance viewer for a highlight's media. Tapping the
 * right half advances, the left half goes back, and reaching the end (or
 * tapping close) dismisses. A lightweight sibling of the story viewer, scoped
 * to a single highlight's stored media.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { ProtectedStackParamList } from '@/navigation';
import { useTheme, Text } from '@/design-system';
import { Image } from '@/components/Image';
import { hitSlop } from '@/constants/layout';
import { useHighlights } from '@/data/query/hooks/useHighlights';
import type { UserId } from '@/types/models';

export default function HighlightViewerScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { highlightId, ownerId } = useRoute<RouteProp<ProtectedStackParamList, 'HighlightViewer'>>().params;
  const { data: highlights } = useHighlights(ownerId as UserId);

  const highlight = useMemo(
    () => highlights?.find((h) => h.id === highlightId),
    [highlights, highlightId],
  );
  const media = highlight?.media ?? [];

  const [index, setIndex] = useState(0);
  const current = media[index];

  const close = useCallback(() => navigation.goBack(), [navigation]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= media.length) {
        navigation.goBack();
        return i;
      }
      return i + 1;
    });
  }, [media.length, navigation]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <StatusBar barStyle="light-content" />
      {current ? (
        <Image
          source={{ uri: current.uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel={highlight?.title ?? 'Highlight'}
        />
      ) : null}

      {/* Tap zones */}
      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapZone} onPress={prev} accessibilityLabel="Previous" />
        <Pressable style={styles.tapZone} onPress={next} accessibilityLabel="Next" />
      </View>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        {/* Progress segments */}
        <View style={[styles.progressRow, { paddingHorizontal: theme.spacing.md }]}>
          {media.map((m, i) => (
            <View
              key={`${m.uri}-${i}`}
              style={[
                styles.segment,
                { backgroundColor: i <= index ? '#FFFFFF' : 'rgba(255,255,255,0.35)' },
              ]}
            />
          ))}
        </View>

        <View style={[styles.topBar, { paddingHorizontal: theme.spacing.lg }]}>
          <Text variant="bodyStrong" color="inverse" numberOfLines={1} style={{ flex: 1 }}>
            {highlight?.title ?? ''}
          </Text>
          <Pressable
            onPress={close}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  tapZone: { flex: 1 },
  overlay: { flex: 1 },
  progressRow: { flexDirection: 'row', gap: 4, paddingTop: 8 },
  segment: { flex: 1, height: 2.5, borderRadius: 2 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, gap: 12 },
});
