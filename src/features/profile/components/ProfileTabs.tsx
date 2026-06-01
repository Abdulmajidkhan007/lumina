/**
 * Lumina — ProfileTabs
 *
 * Segmented control for Posts / Reels / Tagged sections.
 * Animated underline indicator via Reanimated 3.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { screen } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileTab = 'posts' | 'reels' | 'tagged';

export interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { id: ProfileTab; icon: 'grid-outline' | 'film-outline' | 'person-add-outline' }[] = [
  { id: 'posts', icon: 'grid-outline' },
  { id: 'reels', icon: 'film-outline' },
  { id: 'tagged', icon: 'person-add-outline' },
];

const TAB_COUNT = TABS.length;
const TAB_WIDTH = screen.width / TAB_COUNT;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProfileTabs = React.memo(function ProfileTabs({
  activeTab,
  onTabChange,
}: ProfileTabsProps): React.JSX.Element {
  const theme = useTheme();

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  const translateX = useSharedValue(activeIndex * TAB_WIDTH);

  const handleTabPress = useCallback(
    (tab: ProfileTab, index: number) => {
      translateX.value = withTiming(index * TAB_WIDTH, { duration: 200 });
      onTabChange(tab);
    },
    [translateX, onTabChange],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {TABS.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const iconColor = isActive
          ? theme.colors.textPrimary
          : theme.colors.textTertiary;

        return (
          <Pressable
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.id, index)}
            accessibilityRole="tab"
            accessibilityLabel={
              tab.id === 'posts'
                ? 'Posts grid'
                : tab.id === 'reels'
                ? 'Reels'
                : 'Tagged posts'
            }
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons name={tab.icon} size={22} color={iconColor} />
          </Pressable>
        );
      })}

      {/* Animated underline */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: theme.colors.textPrimary, width: TAB_WIDTH },
          indicatorStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1.5,
  },
});
