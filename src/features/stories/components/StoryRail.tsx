/**
 * Lumina — StoryRail
 *
 * Horizontally scrolling strip of story rings. "Your story" is always first,
 * followed by story reels from the useStoryReels query.
 *
 * Tapping "Your story" when the current user has no active reel opens the
 * gallery picker, then hands the picked image off to the full-screen
 * StoryComposer for preview/confirmation before it uploads. When an active
 * reel exists, the ring opens the story viewer as usual (unchanged), while a
 * small "+" badge on the ring always opens the picker to add another story.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import type { ProtectedStackParamList } from '@/navigation';

import { useTheme } from '@/design-system/theme';
import { SkeletonCircle } from '@/design-system/primitives/Skeleton';
import { useStoryReels } from '@/data/query/hooks/useStoryReels';
import { useCurrentUser } from '@/stores/auth.store';
import type { StoryReel , UserSummary } from '@/types/models';
import { StoryRing } from './StoryRing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union item in the rail — either the current user stub or a real StoryReel */
type RailItem =
  | { type: 'currentUser'; user: UserSummary; userId: string; myReel: StoryReel | null }
  | { type: 'reel'; reel: StoryReel };

// ---------------------------------------------------------------------------
// Skeleton strip
// ---------------------------------------------------------------------------

function StoryRailSkeleton(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[styles.skeletonRow, { paddingHorizontal: theme.spacing.lg }]}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCircle key={i} size={70} style={{ marginRight: theme.spacing.md }} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// StoryRail
// ---------------------------------------------------------------------------

export function StoryRail(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const { data: reels, isLoading } = useStoryReels();
  const [pickerBusy, setPickerBusy] = useState(false);

  const handleRingPress = useCallback(
    (userId: string) => {
      navigation.navigate('Story', { userId: userId });
    },
    [navigation],
  );

  // Opens the gallery picker, then hands the picked image off to the
  // full-screen composer for preview/confirmation. No upload happens here —
  // `useCreateStory` is only called from StoryComposerScreen once the user
  // explicitly taps "Share to story".
  const pickAndOpenComposer = useCallback(() => {
    setPickerBusy(true);
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 0.9 },
      (response) => {
        setPickerBusy(false);
        if (response.didCancel === true) return;
        if (response.errorCode !== undefined) {
          if (response.errorMessage != null) {
            Alert.alert('Could not open gallery', response.errorMessage);
          }
          return;
        }

        const asset = response.assets?.[0];
        if (asset?.uri === undefined) return;

        navigation.navigate('StoryComposer', { uri: asset.uri });
      },
    );
  }, [navigation]);

  const handleCurrentUserPress = useCallback(
    (myReel: StoryReel | null) => {
      if (myReel != null) {
        handleRingPress(myReel.author.id);
      } else {
        pickAndOpenComposer();
      }
    },
    [handleRingPress, pickAndOpenComposer],
  );

  const items = React.useMemo<RailItem[]>(() => {
    const result: RailItem[] = [];
    const myReel = currentUser != null
      ? reels?.find((reel) => reel.author.id === currentUser.id) ?? null
      : null;

    if (currentUser != null) {
      result.push({
        type: 'currentUser',
        user: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
        userId: currentUser.id,
        myReel,
      });
    }

    if (reels != null) {
      for (const reel of reels) {
        // The current user's own reel is represented by the "currentUser"
        // stub above (which knows how to route taps to either the viewer or
        // the composer) — skip it here to avoid rendering it twice.
        if (currentUser != null && reel.author.id === currentUser.id) continue;
        result.push({ type: 'reel', reel });
      }
    }

    return result;
  }, [currentUser, reels]);

  const keyExtractor = useCallback((item: RailItem) => {
    if (item.type === 'currentUser') return `current-${item.userId}`;
    return `reel-${item.reel.author.id}`;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<RailItem>) => {
      const isFirst = index === 0;
      const isLast = index === items.length - 1;

      if (item.type === 'currentUser') {
        return (
          <StoryRing
            user={item.user}
            hasUnseen={false}
            isCurrentUser
            isUploading={pickerBusy}
            onPress={() => handleCurrentUserPress(item.myReel)}
            onAddPress={pickAndOpenComposer}
            style={{
              marginLeft: isFirst ? theme.spacing.lg : 0,
              marginRight: isLast ? theme.spacing.lg : theme.spacing.md,
            }}
          />
        );
      }

      return (
        <StoryRing
          user={item.reel.author}
          hasUnseen={item.reel.hasUnseen}
          isCloseFriends={item.reel.isCloseFriends ?? false}
          onPress={handleRingPress}
          style={{
            marginLeft: isFirst ? theme.spacing.lg : 0,
            marginRight: isLast ? theme.spacing.lg : theme.spacing.md,
          }}
        />
      );
    },
    [
      handleCurrentUserPress,
      handleRingPress,
      pickerBusy,
      items.length,
      pickAndOpenComposer,
      theme.spacing.lg,
      theme.spacing.md,
    ],
  );

  if (isLoading && items.length === 0) {
    return <StoryRailSkeleton />;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      style={[styles.list, { backgroundColor: theme.colors.surface }]}
      bounces={false}
      accessibilityRole="list"
      accessibilityLabel="Stories"
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
});
