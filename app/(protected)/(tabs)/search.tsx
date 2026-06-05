/**
 * Lumina — Explore / Search tab
 *
 * Top ExploreSearchBar + debounced (300 ms) query.
 * Empty query   → ExploreGrid (infinite post thumbnails)
 * Non-empty     → SearchResults (infinite user list)
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { tabBarHeight } from '@/constants/layout';
import { ExploreSearchBar } from '@/features/explore/components/ExploreSearchBar';
import { ExploreGrid } from '@/features/explore/components/ExploreGrid';
import { SearchResults } from '@/features/explore/components/SearchResults';
import { useDebounce } from '@/features/explore/hooks/useDebounce';

const DEBOUNCE_MS = 300;

export default function SearchScreen(): React.JSX.Element {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const isSearching = query.trim().length > 0;

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Search bar */}
      <ExploreSearchBar
        value={query}
        onChangeText={setQuery}
        isSearching={isSearching}
        onClear={handleClear}
      />

      {/* Content area */}
      <View style={[styles.body, { paddingBottom: tabBarHeight.default }]}>
        {isSearching ? (
          <SearchResults query={debouncedQuery} />
        ) : (
          <ExploreGrid />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
