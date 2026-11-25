import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/**
 * A short horizontal "no" shake for invalid input. Used by the amount field
 * now and the PIN pad later. Call `shake()` from an event handler, and put
 * `style` on an `Animated.View`.
 */
export function useShake() {
  const offset = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  function shake() {
    offset.set(
      withSequence(
        withTiming(-8, { duration: 50 }),
        withRepeat(withTiming(8, { duration: 100 }), 3, true),
        withTiming(0, { duration: 50 }),
      ),
    );
  }

  return { style, shake };
}
