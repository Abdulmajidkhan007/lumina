# Lumina

A modern social media app built with bare React Native CLI and TypeScript.

## Stack

- **React Native 0.79.x** (bare CLI, New Architecture) / **React 19**
- **React Navigation v7** (native-stack + bottom-tabs, fully typed)
- **TypeScript** (strict mode)
- **TanStack Query** for server state (offline persistence via AsyncStorage)
- **Zustand** for client state
- **React Hook Form** + **Zod** for forms
- **Reanimated** + **Gesture Handler** for animations
- **react-native-keychain** for auth tokens
- **react-native-vector-icons** (Ionicons), **linear-gradient**, **community/blur**

## Getting Started

```bash
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android

# Metro dev server only
npm start
```

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Start Metro |
| `npm run android` | Build + run on Android |
| `npm run ios` | Build + run on iOS (requires pods) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (flat config, typescript-eslint) |

## Notes

- iOS pods are not checked in; run `pod install` on macOS before the first iOS build.
- Vector-icon fonts are linked via `react-native.config.js` (Android `fonts.gradle`, iOS `UIAppFonts`).
