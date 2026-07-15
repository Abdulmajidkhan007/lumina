import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the FCM background message handler as early as possible, before
// any React rendering. Guarded so a missing/unconfigured native Firebase
// setup (no google-services.json yet) never crashes app startup.
try {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async () => {
    // Intentionally empty: no background processing wired up yet.
    // Extend here once a concrete background-notification use case exists.
  });
} catch {
  // Native Firebase messaging module unavailable — safe to ignore.
}

AppRegistry.registerComponent(appName, () => App);
