/**
 * Lumina — Auth stack
 *
 * Unauthenticated flow: welcome (first launch only), login, signup,
 * forgot-password. No headers — each screen renders its own chrome.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import { usePreferencesStore } from '@/stores/preferences.store';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack(): React.JSX.Element {
  // Read once: a returning, signed-out user goes straight to Login.
  const [initialRoute] = React.useState<keyof AuthStackParamList>(() =>
    usePreferencesStore.getState().hasSeenWelcome ? 'Login' : 'Welcome',
  );
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
