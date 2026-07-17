/**
 * Global Jest setup for Lumina.
 *
 * Mocks native modules that have no usable JS fallback under Node/Jest.
 * Keep this file plain JS (no TS) — it runs pre-transform, before the test
 * framework itself is wired up.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// react-native-gesture-handler — official jest setup (mocks native module)
// ---------------------------------------------------------------------------
require('react-native-gesture-handler/jestSetup');

// ---------------------------------------------------------------------------
// react-native-reanimated — official mock
// ---------------------------------------------------------------------------
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// ---------------------------------------------------------------------------
// @react-native-async-storage/async-storage — official jest mock
// ---------------------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ---------------------------------------------------------------------------
// react-native-keychain — in-memory fake, keyed by `service`
// ---------------------------------------------------------------------------
jest.mock('react-native-keychain', () => {
  /** @type {Record<string, { username: string; password: string }>} */
  const store = {};

  return {
    ACCESSIBLE: {
      WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    },
    ACCESS_CONTROL: {},
    AUTHENTICATION_TYPE: {},
    SECURITY_LEVEL: {},

    setGenericPassword: jest.fn((username, password, options) => {
      const service = (options && options.service) || 'default';
      store[service] = { username, password };
      return Promise.resolve({ service, storage: 'memory' });
    }),

    getGenericPassword: jest.fn((options) => {
      const service = (options && options.service) || 'default';
      const entry = store[service];
      if (!entry) return Promise.resolve(false);
      return Promise.resolve({
        service,
        username: entry.username,
        password: entry.password,
        storage: 'memory',
      });
    }),

    resetGenericPassword: jest.fn((options) => {
      const service = (options && options.service) || 'default';
      delete store[service];
      return Promise.resolve(true);
    }),
  };
});

// ---------------------------------------------------------------------------
// react-native-haptic-feedback — no-op
// ---------------------------------------------------------------------------
jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {
    trigger: jest.fn(),
  },
  trigger: jest.fn(),
  HapticFeedbackTypes: {},
}));

// ---------------------------------------------------------------------------
// react-native-mmkv — in-memory fake
// ---------------------------------------------------------------------------
jest.mock('react-native-mmkv', () => {
  class MMKV {
    constructor() {
      this.__store = new Map();
    }
    set(key, value) {
      this.__store.set(key, value);
    }
    getString(key) {
      const v = this.__store.get(key);
      return typeof v === 'string' ? v : undefined;
    }
    getNumber(key) {
      const v = this.__store.get(key);
      return typeof v === 'number' ? v : undefined;
    }
    getBoolean(key) {
      const v = this.__store.get(key);
      return typeof v === 'boolean' ? v : undefined;
    }
    contains(key) {
      return this.__store.has(key);
    }
    delete(key) {
      this.__store.delete(key);
    }
    getAllKeys() {
      return Array.from(this.__store.keys());
    }
    clearAll() {
      this.__store.clear();
    }
  }

  return { MMKV };
});

// ---------------------------------------------------------------------------
// react-native-vector-icons — render every icon set as a lightweight text
// stand-in so components don't need real font glyphs to render in tests.
// ---------------------------------------------------------------------------
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function Icon(props) {
    return React.createElement(Text, props, props.name);
  };
});

jest.mock('react-native-vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function Icon(props) {
    return React.createElement(Text, props, props.name);
  };
});

// ---------------------------------------------------------------------------
// @react-native-community/blur — render children in a plain View
// ---------------------------------------------------------------------------
jest.mock('@react-native-community/blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: function BlurView(props) {
      return React.createElement(View, props, props.children);
    },
  };
});

// ---------------------------------------------------------------------------
// react-native-linear-gradient — pass-through View
// ---------------------------------------------------------------------------
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function LinearGradient(props) {
    return React.createElement(View, props, props.children);
  };
});

// ---------------------------------------------------------------------------
// react-native-video — pass-through View
// ---------------------------------------------------------------------------
jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function Video(props) {
    return React.createElement(View, props, props.children);
  };
});

// ---------------------------------------------------------------------------
// @react-native-firebase/* — empty factories, only needed if a test's import
// graph happens to reach them (none of the current suites do).
// ---------------------------------------------------------------------------
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({}),
  // No native config in tests -> isFirebaseConfigured() is false and the
  // api client falls back to the mock provider.
  getApps: () => [],
  getApp: () => ({}),
}));
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({}),
  getAuth: () => ({ currentUser: null }),
  sendPasswordResetEmail: async () => undefined,
}));
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({}),
  getFirestore: () => ({}),
  collection: () => ({}),
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  getDocs: async () => ({ docs: [], empty: true, size: 0 }),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  startAfter: () => ({}),
  limit: () => ({}),
  documentId: () => ({}),
  increment: () => ({}),
  runTransaction: async () => undefined,
  writeBatch: () => ({ update: () => undefined, commit: async () => undefined }),
  setDoc: async () => undefined,
  updateDoc: async () => undefined,
}));
jest.mock('@react-native-firebase/messaging', () => ({ __esModule: true, default: () => ({}) }));
jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: () => ({}),
  getStorage: () => ({}),
  ref: () => ({}),
  putFile: async () => undefined,
  getDownloadURL: async () => '',
}));
