/**
 * Lumina — Auth group layout
 *
 * Renders the auth Stack with no headers. If the user is already authenticated,
 * immediately redirects to the main tab navigator.
 */

import React from 'react';
import { Stack, Redirect } from 'expo-router';

import { useAuthStatus } from '@/stores/auth.store';

export default function AuthLayout(): React.JSX.Element {
  const status = useAuthStatus();

  if (status === 'authenticated') {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
