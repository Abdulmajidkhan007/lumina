/**
 * Push notification service (Firebase Cloud Messaging).
 *
 * All functions guard against a missing/misconfigured native Firebase setup
 * (e.g. no `google-services.json` / `GoogleService-Info.plist` yet) by
 * importing `@react-native-firebase/messaging` lazily inside each function
 * body and wrapping native calls in try/catch. This means the app will
 * never crash on startup or on screens that call into this service before
 * Firebase has been wired up natively — functions simply resolve to a safe
 * fallback (`null` / `false`) instead of throwing.
 *
 * NOTHING in this module is auto-invoked. `initPushNotifications()` is
 * exported for the navigation/root layer to call explicitly once the app
 * is ready to request permission and register for push (e.g. after login,
 * or from a root-level effect) — wiring that call site is out of scope here.
 */

import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

/** Result of a push-permission request. */
export type PushPermissionResult = {
  granted: boolean;
  status: FirebaseMessagingTypes.AuthorizationStatus | null;
};

/** Handler invoked for messages received while the app is in the foreground. */
export type ForegroundMessageHandler = (
  message: FirebaseMessagingTypes.RemoteMessage,
) => void;

/** No-op unsubscribe returned when messaging is unavailable. */
const noopUnsubscribe = (): void => {};

/**
 * Requests push notification permission from the user (iOS; effectively a
 * no-op resolving to granted on Android). Returns `{ granted: false, status:
 * null }` if the native Firebase messaging module isn't available.
 */
export async function requestPushPermission(): Promise<PushPermissionResult> {
  try {
    const messagingModule = (await import('@react-native-firebase/messaging'))
      .default;
    const status = await messagingModule().requestPermission();
    const granted =
      status === messagingModule.AuthorizationStatus.AUTHORIZED ||
      status === messagingModule.AuthorizationStatus.PROVISIONAL;
    return { granted, status };
  } catch {
    return { granted: false, status: null };
  }
}

/**
 * Returns the current device's FCM registration token, or `null` if
 * unavailable (permission not granted, native module missing, or any
 * failure fetching the token).
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const messagingModule = (await import('@react-native-firebase/messaging'))
      .default;
    const token = await messagingModule().getToken();
    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * Subscribes to messages received while the app is in the foreground.
 * Returns an unsubscribe function; it's a no-op if messaging isn't
 * available. Callers should still call this defensively (e.g. in a
 * `useEffect` cleanup) since the returned function is always safe to invoke.
 */
export function onForegroundMessage(
  handler: ForegroundMessageHandler,
): () => void {
  let unsubscribe: () => void = noopUnsubscribe;

  void (async () => {
    try {
      const messagingModule = (
        await import('@react-native-firebase/messaging')
      ).default;
      unsubscribe = messagingModule().onMessage(async (message) => {
        handler(message);
      });
    } catch {
      // Native messaging module unavailable — keep the no-op unsubscribe.
    }
  })();

  return () => {
    unsubscribe();
  };
}

/**
 * Convenience entry point that requests permission and resolves the FCM
 * token in one call. Not invoked anywhere automatically — call this from a
 * root-level effect (e.g. `RootNavigator`) once you want push registration
 * to kick in.
 */
export async function initPushNotifications(): Promise<string | null> {
  const { granted } = await requestPushPermission();
  if (!granted) {
    return null;
  }
  return getFcmToken();
}
