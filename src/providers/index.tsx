import React, { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/lib/queryClient';
import { asyncStoragePersister } from '@/lib/storage';

// The ThemeProvider lives in the design-system agent's output.
// If the module is absent (e.g. a fresh checkout before the DS agent has run),
// we fall back to rendering children unwrapped. Once the DS is built this
// becomes a normal static import and the fallback path is unreachable.
let ThemeProvider: React.ComponentType<{ children: ReactNode }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const ds = require('@/design-system') as {
    ThemeProvider?: React.ComponentType<{ children: ReactNode }>;
  };
  ThemeProvider = ds.ThemeProvider ?? null;
} catch {
  // Design system not yet built — fall back to no theme wrapper
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppProvidersProps = {
  children: ReactNode;
};

// ---------------------------------------------------------------------------
// AppProviders
// Wraps the entire app in all required context providers.
// ---------------------------------------------------------------------------

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  const withTheme =
    ThemeProvider !== null ? (
      <ThemeProvider>{children}</ThemeProvider>
    ) : (
      <>{children}</>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          {withTheme}
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
