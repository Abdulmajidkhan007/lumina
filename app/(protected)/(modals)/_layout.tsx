/**
 * Lumina — Modals group layout
 *
 * Presents all modal screens. headerShown false — screens render their own headers.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function ModalsLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="create-post" />
    </Stack>
  );
}
