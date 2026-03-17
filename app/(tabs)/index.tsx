import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, Spacing } from '@/constants/theme';
import { DailyTopicTab } from '@/components/features/home/DailyTopicTab';
import { PracticeModeTab } from '@/components/features/home/PracticeModeTab';
import { useRecording } from '@/contexts/RecordingContext';
import { useDailyWord } from '@/hooks/useDailyWord';
import { usePracticeWords } from '@/hooks/usePracticeWords';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useSubmitRecording } from '@/hooks/useSubmitRecording';

type ActiveTab = 'daily' | 'practice';
type RecordingState = 'idle' | 'recording' | 'completed';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { setIsRecording } = useRecording();
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [dailyCompleted, setDailyCompleted] = useState(false);

  const { data: dailyWord } = useDailyWord();
  const { data: practiceWords } = usePracticeWords();
  const audio = useAudioRecording();
  const submitRecording = useSubmitRecording();

  // elapsed in whole seconds for display
  const elapsed = Math.floor(audio.durationMs / 1000);
  const isRecording = recordingState === 'recording';

  useEffect(() => {
    setIsRecording(isRecording);
  }, [isRecording]);

  const handleRecordPress = async () => {
    if (recordingState === 'idle') {
      setRecordingState('recording');
      await audio.start();
    } else if (recordingState === 'recording') {
      setRecordingState('completed');
      await audio.stop();

      const word = activeTab === 'daily' ? (dailyWord ?? null) : null;
      const topicLabel = word ? word.word : activeTab === 'daily' ? '...' : 'Practice';

      if (activeTab === 'daily') {
        setDailyCompleted(true);
      }

      submitRecording.mutate(
        {
          wordId: word?.id ?? 'unknown',
          word: topicLabel,
          mode: activeTab,
          durationMs: audio.durationMs,
          audioUri: audio.uri,
        },
        {
          onSuccess: (recording) => {
            router.push({
              pathname: '/completion',
              params: { topic: topicLabel, mode: activeTab, recordingId: recording.id },
            });
          },
          onSettled: () => {
            setTimeout(() => {
              setRecordingState('idle');
              audio.reset();
            }, 500);
          },
        }
      );
    }
  };

  const handleViewResults = () => {
    router.push({ pathname: '/(tabs)/results' });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header]}>
        <Text
          style={[
            styles.wordmark,
            { color: colors.text, fontFamily: FontFamily.sansSemiBold },
          ]}
        >
          Coherence
        </Text>
        {/* Spacer to balance — no shuffle action needed on daily tab */}
        <View style={styles.headerRight} />
      </View>

      {/* Sub-tab bar */}
      <View style={[styles.subTabBar, { borderBottomColor: colors.divider }]}>
        {(['daily', 'practice'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'daily' ? 'Daily Topic' : 'Practice Mode';
          return (
            <Pressable
              key={tab}
              onPress={() => {
                if (recordingState !== 'recording') setActiveTab(tab);
              }}
              style={styles.subTab}
            >
              <Text
                style={[
                  styles.subTabLabel,
                  {
                    fontFamily: isActive ? FontFamily.sansSemiBold : FontFamily.sans,
                    color: isActive ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
              {isActive && (
                <View style={[styles.subTabIndicator, { backgroundColor: colors.accent }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'daily' ? (
          <DailyTopicTab
            topic={dailyWord?.word ?? '...'}
            pronunciation={dailyWord?.pronunciation}
            pos={dailyWord?.pos}
            definition={dailyWord?.definition}
            exampleSentence={dailyWord?.exampleSentence}
            recordingState={recordingState}
            elapsed={elapsed}
            onRecordPress={handleRecordPress}
            dailyCompleted={dailyCompleted}
            onViewResults={handleViewResults}
          />
        ) : (
          <PracticeModeTab
            recordingState={recordingState}
            elapsed={elapsed}
            onRecordPress={handleRecordPress}
            practiceWords={practiceWords}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  wordmark: {
    fontSize: 16,
    letterSpacing: -0.15,
  },
  headerRight: {
    width: 24,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: Spacing.lg,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
    position: 'relative',
  },
  subTabLabel: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  subTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
});
