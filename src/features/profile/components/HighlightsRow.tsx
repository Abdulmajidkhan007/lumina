/**
 * Lumina — HighlightsRow
 *
 * Horizontal row of Story Highlights pinned under a profile header. On your
 * own profile a leading "New" circle opens a composer (pick images + title)
 * that creates a highlight; long-pressing a highlight you own offers to
 * delete it. Tapping a highlight opens the full-screen HighlightViewer.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { Image } from '@/components/Image';
import { useHighlights } from '@/data/query/hooks/useHighlights';
import { useCreateHighlight } from '@/data/query/hooks/useCreateHighlight';
import { useDeleteHighlight } from '@/data/query/hooks/useDeleteHighlight';
import { HIGHLIGHT_TITLE_MAX } from '@/schemas';
import type { HighlightMediaInput } from '@/data/api/contracts';
import type { ProtectedStackParamList } from '@/navigation';
import type { UserId } from '@/types/models';

const CIRCLE = 64;

export interface HighlightsRowProps {
  userId: UserId;
  isOwn: boolean;
}

export function HighlightsRow({ userId, isOwn }: HighlightsRowProps): React.JSX.Element | null {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data: highlights } = useHighlights(userId);
  const createHighlight = useCreateHighlight();
  const { mutate: deleteHighlight } = useDeleteHighlight();

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<HighlightMediaInput[]>([]);

  const openViewer = useCallback(
    (highlightId: string) => {
      navigation.navigate('HighlightViewer', { highlightId, ownerId: userId });
    },
    [navigation, userId],
  );

  const confirmDelete = useCallback(
    (highlightId: string) => {
      if (!isOwn) return;
      Alert.alert('Delete highlight', 'This highlight will be removed from your profile.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHighlight(highlightId) },
      ]);
    },
    [isOwn, deleteHighlight],
  );

  const pickImages = useCallback(async () => {
    const res = await new Promise<Asset[] | undefined>((resolve) => {
      launchImageLibrary(
        // Downscaled like post media — full-resolution originals are never
        // rendered at that size and just cost upload time and storage.
        { mediaType: 'photo', selectionLimit: 10, quality: 0.8, maxWidth: 1440, maxHeight: 1440 },
        (r) => resolve(r.didCancel ? undefined : r.assets),
      );
    });
    if (!res) return;
    const media: HighlightMediaInput[] = res
      .filter((a) => a.uri)
      .map((a) => ({ uri: a.uri as string, type: 'image', width: a.width, height: a.height }));
    setPicked((prev) => [...prev, ...media].slice(0, 20));
  }, []);

  const handleCreate = useCallback(() => {
    if (title.trim().length === 0 || picked.length === 0) return;
    createHighlight.mutate(
      { title: title.trim(), media: picked },
      {
        onSuccess: () => {
          setComposerOpen(false);
          setTitle('');
          setPicked([]);
        },
      },
    );
  }, [title, picked, createHighlight]);

  const hasAny = (highlights?.length ?? 0) > 0;
  // Nothing to show on someone else's empty profile.
  if (!isOwn && !hasAny) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.lg }]}
      >
        {isOwn ? (
          <Pressable
            style={styles.item}
            onPress={() => setComposerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="New highlight"
          >
            <View
              style={[
                styles.circle,
                styles.newCircle,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="add" size={26} color={theme.colors.textSecondary} />
            </View>
            <Text variant="caption" color="secondary" numberOfLines={1} style={styles.label}>
              New
            </Text>
          </Pressable>
        ) : null}

        {(highlights ?? []).map((h) => (
          <Pressable
            key={h.id}
            style={styles.item}
            onPress={() => openViewer(h.id)}
            onLongPress={() => confirmDelete(h.id)}
            accessibilityRole="button"
            accessibilityLabel={`Highlight: ${h.title}`}
          >
            <View style={[styles.circle, { borderColor: theme.colors.border }]}>
              <Image
                source={{ uri: h.coverUri }}
                style={styles.cover}
                contentFit="cover"
                transition={150}
              />
            </View>
            <Text variant="caption" color="primary" numberOfLines={1} style={styles.label}>
              {h.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer modal */}
      <Modal visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}>
            <Pressable onPress={() => setComposerOpen(false)} accessibilityRole="button" accessibilityLabel="Cancel">
              <Ionicons name="close-outline" size={26} color={theme.colors.textPrimary} />
            </Pressable>
            <Text variant="bodyStrong" color="primary">
              New highlight
            </Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Highlight name"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={HIGHLIGHT_TITLE_MAX}
              style={[
                styles.input,
                { color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => void pickImages()}
                style={[styles.pickTile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                accessibilityRole="button"
                accessibilityLabel="Add photos"
              >
                <Ionicons name="images-outline" size={24} color={theme.colors.textSecondary} />
              </Pressable>
              {picked.map((m, i) => (
                <Image key={`${m.uri}-${i}`} source={{ uri: m.uri }} style={styles.pickTile} contentFit="cover" />
              ))}
            </ScrollView>

            <Button
              label="Create highlight"
              variant="primary"
              size="md"
              fullWidth
              loading={createHighlight.isPending}
              disabled={title.trim().length === 0 || picked.length === 0 || createHighlight.isPending}
              onPress={handleCreate}
              accessibilityLabel="Create highlight"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  scroll: { gap: 16 },
  item: { width: CIRCLE + 8, alignItems: 'center' },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  newCircle: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
  cover: { width: '100%', height: '100%' },
  label: { marginTop: 4, maxWidth: CIRCLE + 8, textAlign: 'center' },
  safeArea: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  pickTile: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
