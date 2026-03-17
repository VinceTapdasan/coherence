import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { RecordButton } from '@/components/ui/RecordButton';
import { Waveform } from './Waveform';

type RecordingState = 'idle' | 'recording' | 'completed';

interface DailyTopicTabProps {
  topic: string;
  pronunciation?: string;
  pos?: string;
  definition?: string;
  exampleSentence?: string;
  recordingState: RecordingState;
  elapsed: number;
  onRecordPress: () => void;
  dailyCompleted?: boolean;
  onViewResults?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DailyTopicTab({
  topic,
  pronunciation,
  pos,
  definition,
  exampleSentence,
  recordingState,
  elapsed,
  onRecordPress,
  dailyCompleted = false,
  onViewResults,
}: DailyTopicTabProps) {
  const { colors } = useTheme();
  const isRecording = recordingState === 'recording';

  return (
    <View style= { styles.container } >
    {/* Scrollable word content */ }
    < ScrollView
  style = { styles.scroll }
  contentContainerStyle = { styles.scrollContent }
  showsVerticalScrollIndicator = { false}
    >
    <Text
          style={
    [
      styles.overline,
      { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
    ]
  }
        >
    TODAY'S TOPIC
      </Text>

      < Text
  style = {
    [
    styles.topicWord,
    {
      color: dailyCompleted ? colors.textSecondary : colors.accent,
      fontFamily: FontFamily.serif,
      opacity: dailyCompleted ? 0.3 : 1,
    },
          ]}
    >
    { topic }
    </Text>

  {
    dailyCompleted ? (
      <>
      <Text
              style= {
        [
        styles.completedHeading,
        { color: colors.text, fontFamily: FontFamily.serif },
              ]}
      >
      You're done for today.
        </Text>
        < Text
    style = {
      [
      styles.completedSub,
      { color: colors.textSecondary, fontFamily: FontFamily.sans },
              ]}
      >
      Your session is being analyzed.Come back tomorrow for a new word.
            </Text>
            { onViewResults && (
        <Pressable
                onPress= { onViewResults }
    style = { [styles.viewResultsBtn, { borderColor: colors.divider }]}
      >
      <Text
                  style={
      [
        styles.viewResultsLabel,
        { color: colors.text, fontFamily: FontFamily.sansMedium },
      ]
    }
                >
      View Results
        </Text>
        </Pressable>
            )
  }
  </>
        ) : (
    <>
    { pronunciation && (
      <Text
                style= {
      [
      styles.pronunciation,
      { color: colors.textSecondary, fontFamily: FontFamily.sans },
                ]}
    >
    { pronunciation }
    </Text>
            )
}
{
  pos && (
    <Text
                style={
    [
      styles.pos,
      { color: colors.textSecondary, fontFamily: FontFamily.sansSemiBold },
    ]
  }
              >
    { pos?.toUpperCase() }
    </Text>
            )
}
{
  definition ? (
    <Text
                style= {
      [
      styles.definition,
      { color: colors.text, fontFamily: FontFamily.sans },
                ]}
    >
    { definition }
    </Text>
            ) : (
    <Text
                style= {
      [
      styles.definition,
      { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
                ]}
    >
    Tap record and speak about this topic for 30 to 60 seconds.
              </Text>
            )
}
{
  exampleSentence && (
    <Text
                style={
    [
      styles.example,
      { color: colors.textSecondary, fontFamily: FontFamily.serifItalic },
    ]
  }
              >
    { exampleSentence }
    </Text>
            )
}
</>
        )}
</ScrollView>

{/* Fixed bottom — record button, never overlaps content */ }
{
  !dailyCompleted && (
    <View style={ styles.bottomBar } pointerEvents = "box-none" >
      <View style={ styles.waveformAbsolute } pointerEvents = "none" >
        <Waveform isActive={ isRecording } />
          </View>
          < View style = { styles.recordArea } >
            <RecordButton state={ recordingState } onPress = { onRecordPress } />
              { isRecording && (
                <>
                <Text
                  style={
    [
      styles.timer,
      { color: colors.text, fontFamily: FontFamily.sansMedium },
    ]
  }
                >
    { formatTime(elapsed) }
    </Text>
    < Text
  style = {
    [
    styles.tapToStop,
    { color: colors.textSecondary, fontFamily: FontFamily.sans },
                  ]}
    >
    Tap to stop
      </Text>
      </>
            )
}
</View>
  </View>
      )}
</View>
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
    paddingBottom: 32,
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
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  topicWord: {
    paddingTop: 24,
    fontSize: 76,
    lineHeight: 70,
    marginBottom: 24,
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
    marginBottom: 48,
  },
  completedHeading: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 12,
  },
  completedSub: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  viewResultsBtn: {
    marginTop: Spacing.lg,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
  },
  viewResultsLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  recordArea: {
    alignItems: 'center',
    gap: 14,
    paddingTop: Spacing.sm,
  },
  timer: {
    fontSize: 22,
    letterSpacing: 0.8,
  },
  tapToStop: {
    fontSize: 12,
  },
});
