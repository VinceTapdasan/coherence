import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGrad, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { RecordButton } from '@/components/ui/RecordButton';
import { Waveform } from './Waveform';
import { PRACTICE_WORDS as FALLBACK_PRACTICE_WORDS } from '@/constants/words';
import type { Word } from '@/types';

type RecordingState = 'idle' | 'recording' | 'completed';

interface PracticeModeTabProps {
  recordingState: RecordingState;
  elapsed: number;
  onRecordPress: () => void;
  practiceWords?: Word[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Slot constants (matching HTML exactly) ──────────────────────────────────
const ITEM_HEIGHT = 88;
const CONTAINER_HEIGHT = 88;
const CONTAINER_CENTER_Y = CONTAINER_HEIGHT / 2;
const SLOT_WIDTH = 280;
const REEL_SIZE = 60;
const LAND_MIN = 30;
const LAND_RANGE = 15;

function buildReel(wordList: string[]): string[] {
  return Array.from({ length: REEL_SIZE }, () =>
    wordList[Math.floor(Math.random() * wordList.length)]
  );
}

const FALLBACK_WORD_NAMES = FALLBACK_PRACTICE_WORDS.map((w) => w.word);

// ─── Reel item ────────────────────────────────────────────────────────────────
interface ReelItemProps {
  word: string;
  itemIndex: number;
  color: string;
  translateY: Animated.SharedValue<number>;
}

function ReelItem({ word, itemIndex, color, translateY }: ReelItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const itemCenterY = itemIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2 + translateY.value;
    const dist = Math.abs(itemCenterY - CONTAINER_CENTER_Y);
    // binary opacity: center = 1.0, all others = 0.2 (matching HTML .slot-item / .slot-item.center)
    const opacity = interpolate(dist, [0, 1], [1.0, 0.2], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.reelItem}>
      <Animated.Text style={[styles.reelText, { color }, animStyle]} numberOfLines={1}>
        {word}
      </Animated.Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PracticeModeTab({
  recordingState,
  elapsed,
  onRecordPress,
  practiceWords,
}: PracticeModeTabProps) {
  const { colors } = useTheme();
  const wordNames = practiceWords ? practiceWords.map((w) => w.word) : FALLBACK_WORD_NAMES;
  const [reel, setReel] = useState<string[]>(() => buildReel(wordNames));
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const landRef = useRef({ word: '' });
  const isRecording = recordingState === 'recording';
  const translateY = useSharedValue(0);

  const handleRollComplete = () => {
    setIsRolling(false);
    setHasRolled(true);
    setSelectedWord(landRef.current.word);
  };

  // matches HTML's spinSlot(): rebuild track, easeOutQuart, 2800ms, land at 30-44
  const handleRoll = () => {
    if (isRolling || isRecording) return;
    const newReel = buildReel(wordNames);
    const landIdx = LAND_MIN + Math.floor(Math.random() * LAND_RANGE);
    landRef.current = { word: newReel[landIdx] };
    setReel(newReel);
    setIsRolling(true);
    setHasRolled(false);
    setSelectedWord('');
    translateY.value = 0;
    translateY.value = withTiming(-(landIdx * ITEM_HEIGHT), {
      duration: 2800,
      easing: Easing.out(Easing.poly(4)), // easeOutQuart: 1 - (1-t)^4
    }, (finished) => {
      if (finished) runOnJS(handleRollComplete)();
    });
  };

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Waveform rendered first so it sits behind content */}
      <View style={styles.waveformBlock} pointerEvents="none">
        <Waveform isActive={isRecording} />
      </View>

      {/* Centered column — matches HTML's .slot-content */}
      <View style={styles.centerColumn}>
        <Text
          style={[styles.overline, { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold }]}
        >
          PRACTICE MODE
        </Text>

        {/* Slot window — 280×88px, single item visible */}
        <View
          style={[
            styles.slotWindow,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <Animated.View style={trackStyle}>
            {reel.map((word, i) => (
              <ReelItem
                key={i}
                word={word}
                itemIndex={i}
                color={colors.accent}
                translateY={translateY}
              />
            ))}
          </Animated.View>

          {/* Top gradient fade — 26px matching HTML ::before */}
          <View style={styles.topFade} pointerEvents="none">
            <Svg width={SLOT_WIDTH} height={26}>
              <Defs>
                <SvgGrad id="slot-top" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity="0" />
                </SvgGrad>
              </Defs>
              <Rect width={SLOT_WIDTH} height={26} fill="url(#slot-top)" />
            </Svg>
          </View>

          {/* Bottom gradient fade — 26px matching HTML ::after */}
          <View style={styles.bottomFade} pointerEvents="none">
            <Svg width={SLOT_WIDTH} height={26}>
              <Defs>
                <SvgGrad id="slot-bottom" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity="0" />
                </SvgGrad>
              </Defs>
              <Rect width={SLOT_WIDTH} height={26} fill="url(#slot-bottom)" />
            </Svg>
          </View>
        </View>

        {/* Sub text — min-height 44 prevents layout jump (matches HTML .slot-sub) */}
        <View style={styles.subTextWrap}>
          {!hasRolled && !isRecording && (
            <Text style={[styles.slotSub, { color: colors.textSecondary, fontFamily: FontFamily.sans }]}>
              Pull the lever and speak about whatever lands.
            </Text>
          )}
          {(hasRolled || isRecording) && selectedWord ? (
            <Text style={[styles.slotSub, { color: colors.textSecondary, fontFamily: FontFamily.sans }]}>
              <Text style={{ color: colors.accent, fontFamily: FontFamily.serifItalic }}>
                "{selectedWord}"
              </Text>
              {!isRecording ? '\nTap below to start recording.' : ''}
            </Text>
          ) : null}
        </View>

        {/* Record area (during recording) */}
        {isRecording && (
          <View style={styles.recordBlock}>
            <RecordButton state={recordingState} onPress={onRecordPress} />
            <Text style={[styles.timer, { color: colors.text, fontFamily: FontFamily.sansSemiBold }]}>
              {formatTime(elapsed)}
            </Text>
            <Text style={[styles.stopHint, { color: colors.textSecondary, fontFamily: FontFamily.sans }]}>
              Tap to stop
            </Text>
          </View>
        )}

        {/* Buttons — matches HTML: spin-btn + go-btn (accent) */}
        {!isRecording && (
          <View style={styles.buttonsStack}>
            <Pressable
              onPress={handleRoll}
              disabled={isRolling}
              style={[
                styles.actionBtn,
                { backgroundColor: isRolling ? colors.textSecondary : colors.text },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: colors.background, fontFamily: FontFamily.sansMedium }]}>
                {hasRolled ? 'Roll Again' : 'Roll a Word'}
              </Text>
            </Pressable>
            {hasRolled && !isRolling && (
              <Pressable
                onPress={onRecordPress}
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.actionBtnText, { color: '#F4F1EC', fontFamily: FontFamily.sansMedium }]}>
                  Start Recording
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  slotWindow: {
    width: SLOT_WIDTH,
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  reelItem: {
    height: ITEM_HEIGHT,
    width: SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelText: {
    fontSize: 44,
    fontFamily: FontFamily.serif,
    textAlign: 'center',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
  },
  subTextWrap: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    paddingHorizontal: Spacing.md,
  },
  slotSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  recordBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timer: {
    fontSize: 22,
    letterSpacing: 0.8,
  },
  stopHint: {
    fontSize: 12,
  },
  buttonsStack: {
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 220,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
  },
  waveformBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
