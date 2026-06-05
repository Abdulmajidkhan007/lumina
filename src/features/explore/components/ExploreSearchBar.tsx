/**
 * Lumina — ExploreSearchBar
 *
 * Search input for the Explore screen. Uses the design system Input primitive
 * with a search icon on the left. Calls onChangeText with the raw value;
 * debouncing is handled by the parent (useDebounce hook in SearchScreen).
 *
 * Memoized with stable callbacks.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Input } from '@/design-system/primitives/Input';
import { hitSlop } from '@/constants/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExploreSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Whether we're in "search mode" (non-empty query) */
  isSearching: boolean;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExploreSearchBar = React.memo(function ExploreSearchBar({
  value,
  onChangeText,
  isSearching,
  onClear,
}: ExploreSearchBarProps): React.JSX.Element {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onClear();
    inputRef.current?.clear();
    inputRef.current?.blur();
  }, [onClear]);

  const searchIcon = (
    <Ionicons
      name="search-outline"
      size={18}
      color={theme.colors.textTertiary}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );

  const clearIcon = isSearching ? (
    <Pressable
      onPress={handleClear}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel="Clear search"
    >
      <Ionicons
        name="close-circle"
        size={18}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  ) : undefined;

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Input
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        leftElement={searchIcon}
        rightElement={clearIcon}
        accessibilityLabel="Search for people and posts"
        accessibilityRole="search"
      />
    </View>
  );
});
