/**
 * Lumina — BlurTabBar
 *
 * Custom animated tab bar using @react-native-community/blur BlurView.
 * Five tabs: Home, Explore, Create (intercepted), Reels, Profile.
 * Active state uses accent gradient color; Reanimated scale/opacity on press.
 * Respects safe-area bottom inset.
 */

import React, { useCallback, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Text } from '@/design-system/primitives/Text';
import { useCurrentUser } from '@/stores/auth.store';
import { Avatar } from '@/design-system/primitives/Avatar';
import { tabBarHeight, screen } from '@/constants/layout';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Translation keys for tab labels — resolved via t() at render time so the
 *  module-level config below stays locale-agnostic. */
type TabLabelKey =
  | 'tabs.home'
  | 'tabs.explore'
  | 'tabs.create'
  | 'tabs.reels'
  | 'tabs.profile';

type TabConfig = {
  name: string;
  labelKey: TabLabelKey;
  icon: string;
  iconActive: string;
};

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'Feed',
    labelKey: 'tabs.home',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    name: 'Search',
    labelKey: 'tabs.explore',
    icon: 'search-outline',
    iconActive: 'search',
  },
  {
    name: 'Create',
    labelKey: 'tabs.create',
    icon: 'add-circle-outline',
    iconActive: 'add-circle',
  },
  {
    name: 'Reels',
    labelKey: 'tabs.reels',
    icon: 'play-circle-outline',
    iconActive: 'play-circle',
  },
  {
    name: 'Profile',
    labelKey: 'tabs.profile',
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
  },
];

const SPRING_CONFIG = { damping: 18, stiffness: 340, mass: 0.7 } as const;
const INDICATOR_SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
const ICON_COLOR_DURATION = 200;
const INDICATOR_WIDTH = 24;

// ---------------------------------------------------------------------------
// Single tab item — memoised to prevent unnecessary re-renders
// ---------------------------------------------------------------------------

type TabItemProps = {
  config: TabConfig;
  isActive: boolean;
  onPress: (name: string, e: GestureResponderEvent) => void;
  onLongPress: (name: string, e: GestureResponderEvent) => void;
  isProfileTab: boolean;
};

const TabItem = React.memo(function TabItem({
  config,
  isActive,
  onPress,
  onLongPress,
  isProfileTab,
}: TabItemProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const reducedMotion = useReducedMotion();
  const label = t(config.labelKey);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(isActive ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedIconProps = useAnimatedProps(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [theme.colors.textTertiary, theme.colors.accent],
    ),
  }));

  useEffect(() => {
    colorProgress.value = reducedMotion
      ? isActive
        ? 1
        : 0
      : withTiming(isActive ? 1 : 0, { duration: ICON_COLOR_DURATION });
  }, [isActive, colorProgress, reducedMotion]);

  const handlePressIn = useCallback(() => {
    scale.value = reducedMotion ? 0.82 : withSpring(0.82, SPRING_CONFIG);
    opacity.value = reducedMotion ? 0.7 : withSpring(0.7, SPRING_CONFIG);
  }, [scale, opacity, reducedMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = reducedMotion ? 1 : withSpring(1, SPRING_CONFIG);
    opacity.value = reducedMotion ? 1 : withSpring(1, SPRING_CONFIG);
  }, [scale, opacity, reducedMotion]);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress(config.name, e);
    },
    [onPress, config.name],
  );

  const handleLongPress = useCallback(
    (e: GestureResponderEvent) => {
      onLongPress(config.name, e);
    },
    [onLongPress, config.name],
  );

  const iconColor = isActive ? theme.colors.accent : theme.colors.textTertiary;
  const iconName = isActive ? config.iconActive : config.icon;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabItemInner, animatedStyle]}>
        {config.name === 'Create' ? (
          // Create tab: gradient circle icon
          <LinearGradient
            colors={[...theme.colors.accentGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </LinearGradient>
        ) : isProfileTab && currentUser ? (
          // Profile tab: user avatar when logged in
          <View style={[styles.avatarWrapper, isActive && styles.avatarActive]}>
            <Avatar
              uri={currentUser.avatarUrl ?? undefined}
              displayName={currentUser.displayName}
              size="xs"
            />
            {isActive ? (
              <View
                style={[
                  styles.avatarRing,
                  { borderColor: theme.colors.accent },
                ]}
              />
            ) : null}
          </View>
        ) : (
          <AnimatedIonicons name={iconName} size={26} animatedProps={animatedIconProps} />
        )}
        {config.name !== 'Create' ? (
          <Text
            variant="overline"
            style={[
              styles.tabLabel,
              { color: iconColor },
            ]}
          >
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// BlurTabBar
// ---------------------------------------------------------------------------

export function BlurTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const tabWidth = screen.width / TAB_CONFIG.length;

  // Index within TAB_CONFIG (visual order) of the currently-focused route —
  // -1 while the focused route isn't one of our known tabs (shouldn't happen).
  const activeConfigIndex = TAB_CONFIG.findIndex((config) => {
    const route = state.routes.find((r) => r.name === config.name);
    return route !== undefined && state.routes.indexOf(route) === state.index;
  });

  const indicatorX = useSharedValue(
    activeConfigIndex >= 0 ? activeConfigIndex * tabWidth : 0,
  );

  useEffect(() => {
    if (activeConfigIndex < 0) return;
    const target = activeConfigIndex * tabWidth;
    indicatorX.value = reducedMotion ? target : withSpring(target, INDICATOR_SPRING);
  }, [activeConfigIndex, tabWidth, indicatorX, reducedMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value + (tabWidth - INDICATOR_WIDTH) / 2 },
    ],
  }));

  const onPress = useCallback(
    (name: string, e: GestureResponderEvent) => {
      const route = state.routes.find((r) => r.name === name);
      if (!route) return;

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
        data: undefined,
      });

      const isFocused = state.index === state.routes.indexOf(route);

      if (!event.defaultPrevented && !isFocused) {
        navigation.navigate(route.name, route.params);
      }

      void e;
    },
    [state, navigation],
  );

  const onLongPress = useCallback(
    (name: string, _e: GestureResponderEvent) => {
      const route = state.routes.find((r) => r.name === name);
      if (!route) return;
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
        data: undefined,
      });
    },
    [state, navigation],
  );

  const bottomInset = Math.max(insets.bottom, 8);

  const isAndroid = Platform.OS === 'android';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomInset,
          height: tabBarHeight.default + bottomInset,
        },
      ]}
      // Prevent tab bar from stealing accessibility focus from content
      importantForAccessibility="yes"
    >
      {isAndroid ? (
        // Android: solid surface since BlurView is unreliable on Android
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.colors.surface },
          ]}
        />
      ) : (
        <BlurView
          blurAmount={25}
          blurType={theme.colorScheme === 'dark' ? 'dark' : 'light'}
          reducedTransparencyFallbackColor={theme.colors.surface}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Top border */}
      <View
        style={[styles.topBorder, { backgroundColor: theme.colors.border }]}
      />

      <View style={styles.tabRow}>
        {/* Active tab indicator — slides beneath the focused icon */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: INDICATOR_WIDTH, backgroundColor: theme.colors.accent },
            indicatorStyle,
          ]}
        />
        {TAB_CONFIG.map((config) => {
          const route = state.routes.find((r) => r.name === config.name);
          const routeIndex = route ? state.routes.indexOf(route) : -1;
          const isFocused = state.index === routeIndex;

          // Suppress unused descriptors lint — descriptors are used by navigator
          void descriptors;

          return (
            <TabItem
              key={config.name}
              config={config}
              isActive={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              isProfileTab={config.name === 'Profile'}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 9999,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    marginTop: 2,
  },
  createGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarActive: {
    // ring applied separately below
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 9999,
    borderWidth: 2,
  },
});
