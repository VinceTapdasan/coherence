import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BAR_COUNT = 80;
const BAR_WIDTH = 1.5;
const BAR_GAP = 1.5;
const MAX_HEIGHT = 220;
const HALF = Math.floor(BAR_COUNT / 2);

// matches HTML: sin(time * 4) frequency = 4 rad/s, period ~1.57s
// tick goes 0→1 in TICK_DURATION, formula uses t * 8π → 4 full cycles per period
const TICK_DURATION = Math.PI * 2 * 1000; // ~6283ms

// accent-dark #8B3A2E = rgb(139, 58, 46)
// accent     #C4614A = rgb(196, 97, 74)
const R1 = 139, G1 = 58, B1 = 46;
const R2 = 196, G2 = 97, B2 = 74;

interface WaveBarProps {
  index: number;
  tick: Animated.SharedValue<number>;
}

function WaveBar({ index, tick }: WaveBarProps) {
  const animStyle = useAnimatedStyle(() => {
    const t = tick.value;
    const dist = Math.abs(index - HALF);
    const falloff = 1 - (dist / HALF) * 0.7;
    const wave = Math.sin(t * Math.PI * 8 + dist * 0.2) * 0.5 + 0.5;
    const noise = Math.abs(Math.sin(t * Math.PI * 8 * 5.3 + index * 3.7)) * 0.2;
    const norm = Math.min(1, (wave * 0.55 + noise) * falloff);
    const h = Math.max(2, norm * MAX_HEIGHT);
    const r = Math.round(R1 + (R2 - R1) * norm);
    const g = Math.round(G1 + (G2 - G1) * norm);
    const b = Math.round(B1 + (B2 - B1) * norm);
    return {
      height: h,
      backgroundColor: `rgb(${r},${g},${b})`,
    };
  });

  return <Animated.View style={[styles.bar, animStyle]} />;
}

interface WaveformProps {
  isActive: boolean;
}

export function Waveform({ isActive }: WaveformProps) {
  const tick = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      tick.value = 0;
      tick.value = withRepeat(
        withTiming(1, { duration: TICK_DURATION, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(tick);
    }
    containerOpacity.value = withTiming(isActive ? 0.45 : 0, { duration: 400 });
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} index={i} tick={tick} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: BAR_GAP,
    height: MAX_HEIGHT + 20,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 1,
  },
});
