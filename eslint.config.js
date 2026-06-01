const expoConfig = require('eslint-config-expo');

module.exports = [
  ...expoConfig,
  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2020,
    },
  },
];
