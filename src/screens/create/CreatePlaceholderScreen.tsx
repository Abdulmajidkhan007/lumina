/**
 * Lumina — Create tab placeholder
 *
 * This screen is never actually rendered — the tab press is intercepted
 * in the tabs layout to push the create-post modal instead.
 * Required by expo-navigation to register the route.
 */

import React from 'react';

export default function CreatePlaceholder(): React.JSX.Element {
  return <></>;
}
