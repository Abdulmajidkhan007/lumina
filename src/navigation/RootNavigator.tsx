/**
 * Lumina — Root navigator
 *
 * Auth gate without router redirects: reads auth status and conditionally
 * renders the branded splash (while hydrating), the auth stack, or the
 * protected stack. Replaces the old expo-router root layout redirects.
 */

import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';

import { useTheme } from '@/design-system';
import { useAuthStatus, useAuthStore } from '@/stores';
import { VerifyEmailBanner } from '@/features/auth';
import { AuthStack } from './AuthStack';
import { BrandedSplash } from './BrandedSplash';
import { ProtectedStack } from './ProtectedStack';

export function RootNavigator(): React.JSX.Element {
  const status = useAuthStatus();
  const hydrate = useAuthStore((s) => s.hydrate);
  const theme = useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  let content: React.JSX.Element;
  if (status === 'idle' || status === 'loading') {
    content = <BrandedSplash />;
  } else if (status === 'authenticated') {
    content = (
      <View style={{ flex: 1 }}>
        <VerifyEmailBanner />
        <ProtectedStack />
      </View>
    );
  } else {
    content = <AuthStack />;
  }

  return (
    <>
      <StatusBar
        barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {content}
    </>
  );
}
