module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-worklets/plugin must be listed last
      // Reanimated v4+ では plugin が react-native-worklets に分離された
      'react-native-worklets/plugin',
    ],
  };
};
