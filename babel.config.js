module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['module-resolver', { root: ['./'], alias: { '@': './src' }, extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] }],
    'react-native-reanimated/plugin',
  ],
};
