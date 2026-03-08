import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { RecordButton } from '@/components/ui/RecordButton';
import { Waveform } from './Waveform';

type RecordingState = 'idle' | 'recording' | 'completed';

interface DailyTopicTabProps {
  topic: string;
  definition?: string;
  exampleSentence?: string;
  recordingState: RecordingState;
  elapsed: number;
  onRecordPress: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DailyTopicTab({
  topic,
  definition,
  exampleSentence,
  recordingState,
  elapsed,
  onRecordPress,
}: DailyTopicTabProps) {
  const { colors } = useTheme();
  const isRecording = recordingState === 'recording';

  return (
    <View style={styles.container}>
      {/* Waveform behind content */}
      <View style={styles.waveformBlock} pointerEvents="none">
        <Waveform isActive={isRecording} />
      </View>

      {/* Centered group: topic + mic together */}
      <View style={styles.centerGroup}>
        <View style={styles.topicBlock}>
          <Text
            style={[
              styles.overline,
              { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            TODAY'S TOPIC
          </Text>
          <Text
            style={[
              styles.topicWord,
              { color: colors.accent, fontFamily: FontFamily.serif, opacity: isRecording ? 0.35 : 1 },
            ]}
          >
            {topic}
          </Text>
          {!isRecording && definition && (
            <Text
              style={[
                styles.wordMeta,
                { color: colors.textSecondary, fontFamily: FontFamily.sans },
              ]}
            >
              {definition}
            </Text>
          )}
          {!isRecording && exampleSentence && (
            <Text
              style={[
                styles.wordExample,
                { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
              ]}
            >
              "{exampleSentence}"
            </Text>
          )}
          {!isRecording && !definition && (
            <Text
              style={[
                styles.instruction,
                { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
              ]}
            >
              Tap record and speak about this topic for 30–60 seconds.
            </Text>
          )}
        </View>

        {/* Record block — sits directly below topic content */}
        <View style={styles.recordBlock}>
          <RecordButton state={recordingState} onPress={onRecordPress} />
          {isRecording && (
            <>
              <Text
                style={[
                  styles.timer,
                  { color: colors.text, fontFamily: FontFamily.sansSemiBold },
                ]}
              >
                {formatTime(elapsed)}
              </Text>
              <Text
                style={[
                  styles.stopHint,
                  { color: colors.textSecondary, fontFamily: FontFamily.sans },
                ]}
              >
                Tap to stop
              </Text>
            </>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  topicBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  topicWord: {
    fontSize: 60,
    lineHeight: 64,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  wordMeta: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  wordExample: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  recordBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  timer: {
    fontSize: 22,
    letterSpacing: 0.8,
  },
  stopHint: {
    fontSize: 12,
  },
  waveformBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
