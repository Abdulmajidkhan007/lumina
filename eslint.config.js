// NOTE: @react-native/eslint-config (0.79.2) is legacy .eslintrc format,
// not flat-config compatible. Using a minimal flat config until an
// eslint-flat-compat / typescript-eslint setup is added in a later stage.
module.exports = [
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', 'dist/**', '.expo/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off',
    },
  },
];
