import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGrad, Line, Path, Polyline, Rect, Stop } from 'react-native-svg';
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

// ─── Slot constants ────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 88;
const CONTAINER_HEIGHT = 88;
const CONTAINER_CENTER_Y = CONTAINER_HEIGHT / 2;
const REEL_SIZE = 60;
const LAND_MIN = 30;
const LAND_RANGE = 15;

function buildReel(wordList: string[]): string[] {
  return Array.from({ length: REEL_SIZE }, () =>
    wordList[Math.floor(Math.random() * wordList.length)]
  );
}

const FALLBACK_WORD_NAMES = FALLBACK_PRACTICE_WORDS.map((w) => w.word);

// ─── Reel item ─────────────────────────────────────────────────────────────────
interface ReelItemProps {
  word: string;
  itemIndex: number;
  color: string;
  translateY: SharedValue<number>;
}

function ReelItem({ word, itemIndex, color, translateY }: ReelItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const itemCenterY = itemIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2 + translateY.value;
    const dist = Math.abs(itemCenterY - CONTAINER_CENTER_Y);
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

// ─── Main component ────────────────────────────────────────────────────────────
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

  // Always use local constants for lookup — ensures pronunciation/pos are present
  // regardless of what React Query cache contains
  const selectedEntry = FALLBACK_PRACTICE_WORDS.find((w) => w.word === selectedWord);

  const handleRollComplete = () => {
    setIsRolling(false);
    setHasRolled(true);
    setSelectedWord(landRef.current.word);
  };

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
    translateY.value = withTiming(
      -(landIdx * ITEM_HEIGHT),
      { duration: 2800, easing: Easing.out(Easing.poly(4)) },
      (finished) => {
        if (finished) runOnJS(handleRollComplete)();
      }
    );
  };

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Scrollable content — word info only */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.overline,
            { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          PRACTICE MODE
        </Text>

        {/* Slot window */}
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

          <View style={styles.topFade} pointerEvents="none">
            <Svg style={StyleSheet.absoluteFillObject}>
              <Defs>
                <SvgGrad id="slot-top-p" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity="0" />
                </SvgGrad>
              </Defs>
              <Rect x="0" y="0" width="100%" height="26" fill="url(#slot-top-p)" />
            </Svg>
          </View>

          <View style={styles.bottomFade} pointerEvents="none">
            <Svg style={StyleSheet.absoluteFillObject}>
              <Defs>
                <SvgGrad id="slot-bottom-p" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity="0" />
                </SvgGrad>
              </Defs>
              <Rect x="0" y="0" width="100%" height="26" fill="url(#slot-bottom-p)" />
            </Svg>
          </View>
        </View>

        {/* Idle prompt */}
        {!hasRolled && !isRecording && (
          <Text
            style={[
              styles.idlePrompt,
              { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
            ]}
          >
            Spin to land on a word, then speak about it.
          </Text>
        )}

        {/* Word detail — after rolling */}
        {(hasRolled || isRecording) && selectedEntry && (
          <>
            <View style={[styles.wordDivider, { backgroundColor: colors.divider }]} />
            <Text
              style={[
                styles.pronunciation,
                { color: colors.textSecondary, fontFamily: FontFamily.sans },
              ]}
            >
              {selectedEntry.pronunciation}
            </Text>
            <Text
              style={[
                styles.pos,
                { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
              ]}
            >
              {selectedEntry.pos?.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.definition,
                { color: colors.text, fontFamily: FontFamily.sans },
              ]}
            >
              {selectedEntry.definition}
            </Text>
            <Text
              style={[
                styles.example,
                { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
              ]}
            >
              {selectedEntry.exampleSentence}
            </Text>
          </>
        )}
      </ScrollView>

      {/* Fixed bottom — action buttons, never overlaps content */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <View style={styles.waveformAbsolute} pointerEvents="none">
          <Waveform isActive={isRecording} />
        </View>

        {/* Idle: single Roll button */}
        {!hasRolled && !isRecording && (
          <View style={styles.singleButtonRow}>
            <View style={styles.circleButtonGroup}>
              <Pressable
                onPress={handleRoll}
                disabled={isRolling}
                style={[
                  styles.circleButton,
                  styles.circleButtonDark,
                  { backgroundColor: colors.text, opacity: isRolling ? 0.4 : 1 },
                ]}
              >
                <ShuffleIcon color={colors.background} size={22} />
              </Pressable>
              <Text
                style={[
                  styles.circleLabel,
                  { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
                ]}
              >
                ROLL
              </Text>
            </View>
          </View>
        )}

        {/* After roll + not recording: Roll Again + Record */}
        {hasRolled && !isRecording && (
          <View style={styles.dualButtonRow}>
            <View style={styles.circleButtonGroup}>
              <Pressable
                onPress={handleRoll}
                disabled={isRolling}
                style={[
                  styles.circleButton,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.divider,
                  },
                ]}
              >
                <ShuffleIcon color={colors.textSecondary} size={20} />
              </Pressable>
              <Text
                style={[
                  styles.circleLabel,
                  { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
                ]}
              >
                ROLL AGAIN
              </Text>
            </View>

            <View style={styles.circleButtonGroup}>
              <Pressable
                onPress={onRecordPress}
                style={[styles.circleButton, { backgroundColor: colors.accent }]}
              >
                <MicIcon color={colors.background} size={22} />
              </Pressable>
              <Text
                style={[
                  styles.circleLabel,
                  { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
                ]}
              >
                RECORD
              </Text>
            </View>
          </View>
        )}

        {/* Recording: mic button + timer */}
        {isRecording && (
          <View style={styles.recordArea}>
            <RecordButton state={recordingState} onPress={onRecordPress} />
            <Text
              style={[styles.timer, { color: colors.text, fontFamily: FontFamily.sansMedium }]}
            >
              {formatTime(elapsed)}
            </Text>
            <Text
              style={[
                styles.tapToStop,
                { color: colors.textSecondary, fontFamily: FontFamily.sans },
              ]}
            >
              Tap to stop
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Inline SVG icons (no new dependencies) ───────────────────────────────────
function ShuffleIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="23 4 23 10 17 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="1 20 1 14 7 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="1" width="6" height="11" rx="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19 10v1a7 7 0 0 1-14 0v-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line x1="12" y1="19" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="23" x2="16" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
  },
  bottomBar: {
    paddingBottom: 40,
    paddingTop: 16,
    alignItems: 'center',
  },
  waveformAbsolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overline: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  slotWindow: {
    width: '100%',
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 0,
    position: 'relative',
  },
  reelItem: {
    height: ITEM_HEIGHT,
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
  idlePrompt: {
    fontSize: 17,
    lineHeight: 27,
    marginTop: 20,
    marginBottom: 40,
  },
  wordDivider: {
    height: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  pronunciation: {
    fontSize: 14,
    marginBottom: 4,
  },
  pos: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  definition: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 10,
  },
  example: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 40,
  },
  singleButtonRow: {
    alignItems: 'center',
  },
  dualButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  circleButtonGroup: {
    alignItems: 'center',
    gap: 8,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  circleLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recordArea: {
    alignItems: 'center',
    gap: 14,
  },
  timer: {
    fontSize: 22,
    letterSpacing: 0.8,
  },
  tapToStop: {
    fontSize: 12,
  },
});
