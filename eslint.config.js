// Flat ESLint config for bare React Native + TypeScript.
// (@react-native/eslint-config is legacy .eslintrc format, so we compose
// typescript-eslint + react-hooks directly.)
const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'dist/**',
      '.expo/**',
      'babel.config.js',
      'metro.config.js',
      'react-native.config.js',
      'eslint.config.js',
      'index.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Classic hook rules only — the v7 compiler-powered rules (immutability,
      // refs) false-positive on Reanimated's sharedValue.value API.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
