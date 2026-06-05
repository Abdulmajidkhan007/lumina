/**
 * Lumina — BlurTabBar
 *
 * Custom animated tab bar using expo-blur BlurView.
 * Five tabs: Home, Explore, Create (intercepted), Reels, Profile.
 * Active state uses accent gradient color; Reanimated scale/opacity on press.
 * Respects safe-area bottom inset.
 */

import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { useCurrentUser } from '@/stores/auth.store';
import { Avatar } from '@/design-system/primitives/Avatar';
import { tabBarHeight } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'index',
    label: 'Home',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    name: 'search',
    label: 'Explore',
    icon: 'search-outline',
    iconActive: 'search',
  },
  {
    name: 'create',
    label: 'Create',
    icon: 'add-circle-outline',
    iconActive: 'add-circle',
  },
  {
    name: 'reels',
    label: 'Reels',
    icon: 'play-circle-outline',
    iconActive: 'play-circle',
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
  },
];

const SPRING_CONFIG = { damping: 18, stiffness: 340, mass: 0.7 } as const;

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
  const currentUser = useCurrentUser();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.82, SPRING_CONFIG);
    opacity.value = withSpring(0.7, SPRING_CONFIG);
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withSpring(1, SPRING_CONFIG);
  }, [scale, opacity]);

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
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabItemInner, animatedStyle]}>
        {config.name === 'create' ? (
          // Create tab: gradient circle icon
          <LinearGradient
            colors={theme.colors.accentGradient}
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
          <Ionicons name={iconName} size={26} color={iconColor} />
        )}
        {config.name !== 'create' ? (
          <Text
            variant="overline"
            style={[
              styles.tabLabel,
              { color: iconColor },
            ]}
          >
            {config.label}
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
  const insets = useSafeAreaInsets();

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
          intensity={80}
          tint={theme.colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Top border */}
      <View
        style={[styles.topBorder, { backgroundColor: theme.colors.border }]}
      />

      <View style={styles.tabRow}>
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
              isProfileTab={config.name === 'profile'}
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
