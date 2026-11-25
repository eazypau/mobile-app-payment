/**
 * Minimal stand-in for `react-native-reanimated/mock`.
 *
 * Reanimated 4.7.1's official mock imports the real library, which throws
 * under Jest ("setCSSEventHandler is not available in JSReanimated"), and
 * Expo Router's test setup then silently falls back to an empty object.
 * This covers only the Reanimated APIs this app uses. Animations don't run
 * in tests; we only need the components to render.
 */
const { View } = require('react-native');

const passThrough = (value) => value;
const zoomIn = { springify: () => zoomIn };

module.exports = {
  __esModule: true,
  default: { View, call: () => {} },
  useSharedValue: (initial) => ({ get: () => initial, set: () => {} }),
  useAnimatedStyle: () => ({}),
  withTiming: passThrough,
  withSequence: passThrough,
  withRepeat: passThrough,
  ZoomIn: zoomIn,
};
