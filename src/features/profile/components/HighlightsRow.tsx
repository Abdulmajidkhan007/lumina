/**
 * Lumina — HighlightsRow
 *
 * Horizontal row of Story Highlights pinned under a profile header. On your
 * own profile a leading "New" circle opens the one-screen HighlightComposer
 * (stories from your archive → name → cover → Save); long-pressing a
 * highlight you own offers to delete it. Tapping a highlight opens the
 * full-screen HighlightViewer.
 */

import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Image } from '@/components/Image';
import { useHighlights } from '@/data/query/hooks/useHighlights';
import { useDeleteHighlight } from '@/data/query/hooks/useDeleteHighlight';
import type { ProtectedStackParamList } from '@/navigation';
import type { UserId } from '@/types/models';
import { HighlightComposer } from './HighlightComposer';

const CIRCLE = 64;

export interface HighlightsRowProps {
  userId: UserId;
  isOwn: boolean;
}

export function HighlightsRow({ userId, isOwn }: HighlightsRowProps): React.JSX.Element | null {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data: highlights } = useHighlights(userId);
  const { mutate: deleteHighlight } = useDeleteHighlight();
  const [composerOpen, setComposerOpen] = useState(false);

  const openViewer = useCallback(
    (highlightId: string) => {
      navigation.navigate('HighlightViewer', { highlightId, ownerId: userId });
    },
    [navigation, userId],
  );

  const confirmDelete = useCallback(
    (highlightId: string) => {
      if (!isOwn) return;
      Alert.alert(t('highlights.deleteTitle'), t('highlights.deleteBody'), [
        { text: t('highlights.cancel'), style: 'cancel' },
        { text: t('highlights.delete'), style: 'destructive', onPress: () => deleteHighlight(highlightId) },
      ]);
    },
    [isOwn, deleteHighlight, t],
  );

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
            accessibilityLabel={t('highlights.newTitle')}
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
              {t('highlights.new')}
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
            accessibilityLabel={t('highlights.open', { title: h.title })}
          >
            <View style={[styles.circle, { borderColor: theme.colors.border }]}>
              <Image source={{ uri: h.coverUri }} style={styles.cover} contentFit="cover" />
            </View>
            <Text variant="caption" color="primary" numberOfLines={1} style={styles.label}>
              {h.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isOwn ? <HighlightComposer visible={composerOpen} onClose={() => setComposerOpen(false)} /> : null}
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
});
