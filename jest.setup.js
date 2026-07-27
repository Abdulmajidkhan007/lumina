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
// @react-native-firebase/* — mocked as the NAMESPACED (chainable) API, since
// that's what src/lib/firebase.ts and src/data/api/firebase/** now call
// (`firestore()`, `auth()`, `storage()` as callable default exports, bound
// to the default app). `getApps()` stays empty so `isFirebaseConfigured()`
// is false and the api client falls back to the mock provider — none of
// these fakes are exercised for real request logic, they only need to
// exist so the *.firebase.ts modules can be imported without throwing.
// ---------------------------------------------------------------------------
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({}),
  // No native config in tests -> isFirebaseConfigured() is false and the
  // api client falls back to the mock provider.
  getApps: () => [],
  getApp: () => ({}),
}));

jest.mock('@react-native-firebase/auth', () => {
  const fakeUser = {
    uid: 'mock-uid',
    email: null,
    emailVerified: false,
    providerData: [],
    getIdToken: async () => 'mock-token',
    sendEmailVerification: async () => undefined,
    reauthenticateWithCredential: async () => ({ user: fakeUser }),
    updatePassword: async () => undefined,
    delete: async () => undefined,
  };
  const authModule = {
    currentUser: null,
    signInWithEmailAndPassword: async () => ({ user: fakeUser }),
    createUserWithEmailAndPassword: async () => ({ user: fakeUser }),
    signInWithCredential: async () => ({ user: fakeUser }),
    signOut: async () => undefined,
    sendPasswordResetEmail: async () => undefined,
  };
  const authDefault = () => authModule;
  authDefault.GoogleAuthProvider = { credential: () => ({}) };
  authDefault.EmailAuthProvider = { credential: () => ({}) };
  return { __esModule: true, default: authDefault };
});

jest.mock('@react-native-firebase/firestore', () => {
  const fakeDocSnapshot = { exists: () => false, id: 'mock-id', data: () => ({}) };
  const fakeQuerySnapshot = { docs: [], empty: true, size: 0 };
  const chainable = {
    collection: () => chainable,
    doc: () => chainable,
    where: () => chainable,
    orderBy: () => chainable,
    startAfter: () => chainable,
    limit: () => chainable,
    get: async () => fakeQuerySnapshot,
    set: async () => undefined,
    update: async () => undefined,
    delete: async () => undefined,
    // Realtime subscriptions (useLiveMessages) — emit nothing, return unsubscribe.
    onSnapshot: () => () => undefined,
  };
  const fakeTx = {
    get: async () => fakeDocSnapshot,
    set: () => undefined,
    update: () => undefined,
    delete: () => undefined,
  };
  const firestoreModule = {
    ...chainable,
    runTransaction: async (fn) => fn(fakeTx),
    batch: () => ({ update: () => undefined, delete: () => undefined, commit: async () => undefined }),
  };
  const firestoreDefault = () => firestoreModule;
  firestoreDefault.FieldValue = {
    increment: (n) => ({ __op: 'increment', n }),
    arrayUnion: (...items) => ({ __op: 'arrayUnion', items }),
  };
  firestoreDefault.FieldPath = {
    documentId: () => ({ __op: 'documentId' }),
  };
  return { __esModule: true, default: firestoreDefault };
});

jest.mock('@react-native-firebase/messaging', () => ({ __esModule: true, default: () => ({}) }));

jest.mock('@react-native-firebase/storage', () => {
  const fakeRef = {
    putFile: async () => undefined,
    getDownloadURL: async () => '',
  };
  const storageDefault = () => ({ ref: () => fakeRef });
  return { __esModule: true, default: storageDefault };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
    getString: jest.fn(async () => ''),
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: () => undefined,
    hasPlayServices: async () => true,
    signIn: async () => ({ type: 'success', data: { idToken: 'test' } }),
    signOut: async () => undefined,
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));
