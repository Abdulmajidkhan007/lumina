/**
 * Jest configuration for Lumina.
 *
 * Uses the react-native preset (Babel transform + Haste config) and adds:
 *   - a setup file mocking native modules that have no JS fallback
 *   - a moduleNameMapper mirroring the `@/*` path alias from tsconfig.json
 *   - a transformIgnorePatterns override so RN's ESM-flavoured packages
 *     (which ship untranspiled TS/Flow/ESM in node_modules) still go through
 *     babel-jest instead of being skipped.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@shopify/flash-list|@tanstack|zustand|@sentry/react-native|@react-native-firebase)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
