// Alternative slot implementation — not currently used in PracticeModeTab
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { FontFamily } from '@/constants/theme';
import { PRACTICE_WORDS as PRACTICE_WORDS_DATA } from '@/constants/words';

const PRACTICE_WORDS = PRACTICE_WORDS_DATA.map((w) => w.word);

const ITEM_HEIGHT = 96;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT;
const CONTAINER_CENTER_Y = CONTAINER_HEIGHT / 2;

// Build an extended word list: shuffle 3x the practice words for a long reel
function buildReel(): string[] {
  const pool = [...PRACTICE_WORDS, ...PRACTICE_WORDS, ...PRACTICE_WORDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

const REEL_WORDS = buildReel();
const START_INDEX = 5; // initial center index — ensures buffer above

interface ReelItemProps {
  word: string;
  itemIndex: number;
  translateY: Animated.SharedValue<number>;
}

function ReelItem({ word, itemIndex, translateY }: ReelItemProps) {
  const animStyle = useAnimatedStyle(() => {
    // Visual center of this item within the container
    const itemCenterY = itemIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2 + translateY.value;
    const dist = Math.abs(itemCenterY - CONTAINER_CENTER_Y);

    const opacity = interpolate(
      dist,
      [0, ITEM_HEIGHT * 0.6, ITEM_HEIGHT * 1.5, ITEM_HEIGHT * 2.4],
      [1.0, 0.55, 0.18, 0.06],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      dist,
      [0, ITEM_HEIGHT, ITEM_HEIGHT * 2],
      [1.0, 0.62, 0.44],
      Extrapolation.CLAMP
    );

    const color = interpolateColor(
      Math.min(dist / (ITEM_HEIGHT * 0.8), 1),
      [0, 1],
      ['#C4614A', '#9A9590']
    );

    return {
      opacity,
      transform: [{ scale }],
      color,
    };
  });

  return (
    <View style={styles.reelItem}>
      <Animated.Text
        style={[
          styles.reelText,
          { fontFamily: FontFamily.serif },
          animStyle,
        ]}
        numberOfLines={1}
      >
        {word}
      </Animated.Text>
    </View>
  );
}

interface SlotMachineWordProps {
  onWordSelected: (word: string) => void;
  isRolling: boolean;
  onRollStart: () => void;
}

export function SlotMachineWord({
  onWordSelected,
  isRolling,
  onRollStart,
}: SlotMachineWordProps) {
  const [centerIndex, setCenterIndex] = useState(START_INDEX);
  // translateY positions the reel so centerIndex is at container center
  const getTranslateForIndex = (idx: number) =>
    -(idx * ITEM_HEIGHT) - ITEM_HEIGHT / 2 + CONTAINER_CENTER_Y;

  const translateY = useSharedValue(getTranslateForIndex(START_INDEX));

  const handleRollComplete = (targetIndex: number) => {
    setCenterIndex(targetIndex);
    onWordSelected(REEL_WORDS[targetIndex]);
  };

  const roll = () => {
    if (isRolling) return;
    onRollStart();

    const minSteps = 10;
    const extraSteps = Math.floor(Math.random() * 8);
    const totalSteps = minSteps + extraSteps;
    const targetIndex = Math.min(centerIndex + totalSteps, REEL_WORDS.length - 4);
    const targetY = getTranslateForIndex(targetIndex);

    translateY.value = withTiming(targetY, {
      duration: 1600,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(handleRollComplete)(targetIndex);
      }
    });
  };

  return { translateY, roll, centerIndex };
}

// The visual reel component — separate from the logic hook
interface SlotReelViewProps {
  translateY: Animated.SharedValue<number>;
}

export function SlotReelView({ translateY }: SlotReelViewProps) {
  return (
    <View style={styles.viewport}>
      <Animated.View
        style={[
          styles.reel,
          useAnimatedStyle(() => ({
            transform: [{ translateY: translateY.value }],
          })),
        ]}
      >
        {REEL_WORDS.map((word, i) => (
          <ReelItem key={i} word={word} itemIndex={i} translateY={translateY} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
  },
  reel: {
    // height is determined by children
  },
  reelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelText: {
    fontSize: 72,
    lineHeight: 80,
    textAlign: 'center',
  },
});
